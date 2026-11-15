import { expect, test, type Page } from '@playwright/test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { MailSlurp } from 'mailslurp-client';
import { endSession, requestCode, submitCode } from './flow';
import { extractCode, realNumber } from './sms';

const phone = '+12025550123';
const userId = 'existing-fixture-user';
const code = '123456';

async function installFixture(page: Page, profileId = userId) {
  let ended = false;
  await page.route('**/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (status: number, body: object, headers: Record<string,string> = {}) =>
      route.fulfill({ status, headers, json: body });
    if (request.headers()['x-appwrite-project'] !== 'local-fixture') {
      return json(403, { message: 'Unexpected project' });
    }
    if (request.method() === 'POST' && path === '/v1/account/tokens/phone') {
      const data = request.postDataJSON();
      if (!data.userId || data.phone !== phone) return json(400, { message: 'Unexpected token request' });
      return json(201, { userId }); // Appwrite returns the existing user's ID for a known phone.
    }
    if (request.method() === 'POST' && path === '/v1/account/sessions/token') {
      const data = request.postDataJSON();
      if (data.userId !== userId || data.secret !== code) return json(401, { message: 'Invalid code' });
      return json(201, { userId }, { 'set-cookie': 'fixture_session=active; Path=/; HttpOnly; SameSite=Lax' });
    }
    if (request.headers().cookie?.includes('fixture_session=active') && !ended) {
      if (request.method() === 'GET' && path === '/v1/account') return json(200, { $id: profileId, phone });
      if (request.method() === 'DELETE' && path === '/v1/account/sessions/current') {
        ended = true;
        return route.fulfill({ status: 204, headers: { 'set-cookie': 'fixture_session=; Path=/; Max-Age=0' } });
      }
    }
    return json(401, { message: 'Unexpected request or missing session' });
  });
  return { ended: () => ended };
}

test('signs in an existing phone account, reads its profile, and signs out', async ({ page }) => {
  const fixture = await installFixture(page);
  await requestCode(page, phone);
  await submitCode(page, code);
  await expect(page.getByRole('status')).toHaveText('Signed in to the expected account');
  await endSession(page);
  expect(fixture.ended()).toBe(true);
});

test('reads a fresh SMS through the MailSlurp SDK and completes the browser login', async ({ page }) => {
  const marker = 'Example Staging';
  const phoneId = 'fixture-number';
  const server = createServer(async (req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.method === 'GET' && req.url === '/phone/numbers/' + phoneId) {
      res.end(JSON.stringify({ id: phoneId, phoneNumber: phone }));
      return;
    }
    if (req.method === 'POST' && req.url === '/waitForSms') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk);
      const filter = JSON.parse(Buffer.concat(chunks).toString());
      const match = filter.matches?.[0];
      if (filter.phoneNumberId === phoneId && Date.parse(filter.since) <= Date.now() &&
          filter.count === 1 && filter.timeout === 60_000 && match?.field === 'BODY' &&
          match.should === 'CONTAIN' && match.value === marker) {
        res.end(JSON.stringify([{ id: 'fixture-sms', phoneNumber: phoneId,
          createdAt: new Date().toISOString(), body: marker + ': ' + code }]));
        return;
      }
    }
    res.writeHead(400).end('{}');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing fixture port');
    const client = new MailSlurp({ apiKey: 'local-fixture', basePath: 'http://127.0.0.1:' + address.port });
    const target = await realNumber(client, phoneId, marker);
    const fixture = await installFixture(page);
    const since = await requestCode(page, target.phone);
    await submitCode(page, await target.codeSince(since));
    await expect(page.getByRole('status')).toHaveText('Signed in to the expected account');
    await endSession(page);
    expect(fixture.ended()).toBe(true);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('rejects an incorrect code', async ({ page }) => {
  await installFixture(page);
  await requestCode(page, phone);
  await submitCode(page, '000000');
  await expect(page.getByRole('status')).toHaveText('Session or account verification failed');
  await expect(page.getByRole('button', { name: 'End test session' })).toBeHidden();
});

test('detects a different account and cleans up the created session', async ({ page }) => {
  const fixture = await installFixture(page, 'different-account');
  await requestCode(page, phone);
  await submitCode(page, code);
  await expect(page.getByRole('status')).toHaveText('Session or account verification failed');
  await endSession(page);
  expect(fixture.ended()).toBe(true);
});

test('accepts one fresh, relevant code and rejects stale or ambiguous messages', () => {
  const since = new Date('2026-01-01T00:00:00Z');
  const sms = { phoneNumber: 'fixture-number', createdAt: since, body: 'Example Staging code: 123456' };
  const read = (message: typeof sms) => extractCode(message, sms.phoneNumber, since, 'Example Staging');
  expect(read(sms)).toBe(code);
  expect(() => read({ ...sms, createdAt: new Date(since.getTime() - 1) })).toThrow();
  expect(() => read({ ...sms, phoneNumber: 'other-number' })).toThrow();
  expect(() => read({ ...sms, body: 'Different project: 123456' })).toThrow();
  expect(() => read({ ...sms, body: sms.body + ' or 654321' })).toThrow();
  expect(() => read({ ...sms, body: 'Example Staging: 1234567' })).toThrow();
});
