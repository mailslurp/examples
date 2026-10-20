import assert from 'node:assert/strict';
import test from 'node:test';
import { emailOtp, sendEmail, testPhone, createWebhook, renderEmail } from '../javascript-documentation-workflows/workflows.js';

function fakeClient({ waitError = false, timedOut = false, screenshots = [{}] } = {}) {
  const calls = [];
  let message;
  return {
    calls,
    createInboxWithOptions: async (options) => { calls.push(['inbox', options]); return { id: 'owned-inbox', emailAddress: 'qa@valid-sandbox.test' }; },
    sendEmail: async (id, value) => { assert.equal(id, 'owned-inbox'); assert.deepEqual(value.to, ['qa@valid-sandbox.test']); message = value; },
    waitForLatestEmail: async (id, timeout, unread) => { assert.equal(timeout, 30_000); assert.equal(unread, true); if (waitError) throw Error('timeout'); return message; },
    deleteInbox: async (id) => { calls.push(['deleted', id]); },
    phoneController: { getPhoneNumber: async (input) => { calls.push(['phone', input]); return { phoneNumber: '+15555550100' }; } },
    waitController: { waitForLatestSms: async (input) => { assert.equal(input.waitForSingleSmsOptions.timeout, 30_000); return { body: 'A test SMS' }; } },
    webhookController: { createWebhook: async (input) => { calls.push(['webhook', input]); assert.equal(input.createWebhookOptions.eventName, 'NEW_EMAIL'); return { id: 'owned-webhook' }; } },
    devicePreviewsController: {
      createDevicePreviewRun: async () => ({ run: { runId: 'owned-render' } }),
      waitForDevicePreviewRun: async (input) => { assert.equal(input.timeoutMillis, 30_000); return { timedOut, run: { status: timedOut ? 'RUNNING' : 'COMPLETE' } }; },
      getDevicePreviewRunResults: async () => { calls.push(['results']); return { screenshots }; },
    },
  };
}
for (const [name, run] of [['OTP', emailOtp], ['send', sendEmail]]) {
  test(`${name} uses returned sandbox address and cleans only its created inbox`, async () => {
    const client = fakeClient(); await run(client);
    assert.equal(client.calls[0][1].expiresIn, 300_000);
    assert.deepEqual(client.calls.at(-1), ['deleted', 'owned-inbox']);
  });
  test(`${name} cleans its inbox when the bounded receive fails`, async () => {
    const client = fakeClient({ waitError: true });
    await assert.rejects(run(client), /timeout/);
    assert.deepEqual(client.calls.at(-1), ['deleted', 'owned-inbox']);
  });
}
test('phone uses an explicit existing ID and never provisions capacity', async () => { const client = fakeClient(); await testPhone(client); assert.deepEqual(client.calls.map(x => x[0]), ['phone']); });
test('webhook registers the documented NEW_EMAIL payload', async () => { const client = fakeClient(); await createWebhook(client); assert.equal(client.calls[0][0], 'webhook'); });
test('render timeout cannot pass as success', async () => { const client = fakeClient({ timedOut: true }); await assert.rejects(renderEmail(client), /owned-render.*still running/); assert.equal(client.calls.length, 0); });
test('render with no screenshots cannot pass as success', async () => { await assert.rejects(renderEmail(fakeClient({ screenshots: [] })), /no screenshots/); });
test('completed render retrieves actual result metadata', async () => { const client = fakeClient(); await renderEmail(client); assert.deepEqual(client.calls, [['results']]); });
