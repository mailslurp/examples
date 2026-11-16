import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';

if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY on the runner.');
const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
const newInbox = () => mail.createInboxWithOptions({ expiresIn: 3600000, name: 'Account settings test' });
const newPassword = () => 'Aa1!' + randomBytes(24).toString('base64url');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function readLink(inbox, since, action, callback) {
  const email = await mail.waitController.waitForLatestEmail({
    inboxId: inbox.id, since, unreadOnly: true, timeout: 90000
  });
  const { links } = await mail.emailController.getEmailLinks({ emailId: email.id });
  const endpoint = new URL('/auth/v1/verify', process.env.VITE_SUPABASE_URL);
  const matches = new Set(links.filter(href => {
    const url = new URL(href);
    return url.origin === endpoint.origin && url.pathname === endpoint.pathname &&
      url.searchParams.get('type') === action && url.searchParams.get('token') &&
      url.searchParams.get('redirect_to') === callback;
  }));
  if (matches.size !== 1) throw new Error('Expected one matching link for the project, action and callback.');
  return [...matches][0];
}

async function follow(page, href, callback) {
  try { await page.goto(href); await page.waitForURL(url => url.origin === new URL(callback).origin); }
  catch { throw new Error('Email link did not reach the local callback.'); }
}

async function enterCredentials(page, inbox, password) {
  await page.getByLabel('Email address', { exact: true }).fill(inbox.emailAddress);
  await page.getByLabel('Password').fill(password);
}

async function signup(page, inbox, password, callback) {
  await page.goto(callback);
  await enterCredentials(page, inbox, password);
  const since = new Date();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status').last()).toHaveText('Check your signup email');
  await follow(page, await readLink(inbox, since, 'signup', callback), callback);
  await expect(page.locator('#address')).toHaveText(inbox.emailAddress);
  return page.locator('#address').getAttribute('data-user-id');
}

async function image(page, name) {
  if (!process.env.SCREENSHOT_DIR) return;
  await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
  await page.locator('#summary').screenshot({
    path: path.join(process.env.SCREENSHOT_DIR, name + '.png'), maskColor: '#40594f', mask: [page.locator('#address')]
  });
}

test('secure email change requires both mailboxes and preserves the account', async ({page, browser, baseURL}) => {
  const callback = baseURL + '/';
  const current = await newInbox();
  let replacement;
  try {
    replacement = await newInbox();
    const password = newPassword();
    const id = await signup(page, current, password, callback);
    // Let the provider's per-user email cooldown elapse after signup.
    await pause(Number(process.env.AUTH_EMAIL_COOLDOWN_SECONDS || 65) * 1000);
    const since = new Date();
    await page.getByLabel('New email address').fill(replacement.emailAddress);
    await page.getByRole('button', { name: 'Request change' }).click();
    await expect(page.getByRole('status').last()).toHaveText('Email change requested');
    const [first, second] = await Promise.all([current, replacement].map(
      inbox => readLink(inbox, since, 'email_change', callback)
    ));
    if (first === second) throw new Error('Expected distinct confirmations.');
    const reader = await browser.newContext();
    try {
      const tab = await reader.newPage();
      await follow(tab, first, callback);
      await page.reload();
      await expect(page.locator('#address')).toHaveText(current.emailAddress);
      await expect(page.locator('#pending')).toHaveText('Awaiting confirmation');
      await image(page, 'one-confirmation');
      await follow(tab, second, callback);
    } finally { await reader.close(); }
    const fresh = await browser.newContext();
    try {
      const tab = await fresh.newPage();
      await tab.goto(callback);
      await enterCredentials(tab, replacement, password);
      await tab.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(tab.locator('#address')).toHaveText(replacement.emailAddress);
      await expect(tab.locator('#address')).toHaveAttribute('data-user-id', id);
      await expect(tab.locator('#pending')).toHaveText('No pending change');
      await image(tab, 'both-confirmations');
    } finally { await fresh.close(); }
  } finally {
    await Promise.all([current, replacement].filter(Boolean).map(inbox => mail.deleteInbox(inbox.id)));
  }
});

test('a returning account goes from aal1 to aal2 after a fresh authenticator code', async ({page, browser, baseURL}) => {
  const callback = baseURL + '/';
  const inbox = await newInbox();
  let device;
  try {
    const password = newPassword();
    const id = await signup(page, inbox, password, callback);
    const enrolled = page.waitForResponse(response => {
      const url = new URL(response.url());
      return url.origin === new URL(process.env.VITE_SUPABASE_URL).origin &&
        url.pathname === '/auth/v1/factors' && response.request().method() === 'POST';
    });
    await page.getByRole('button', { name: 'Set up authenticator' }).click();
    const factor = await (await enrolled).json();
    if (!factor.totp?.uri) throw new Error('Supabase did not return an authenticator URI.');
    device = await mail.mfaController.createTotpDeviceForOtpAuthUrl({
      createTotpDeviceOtpAuthUrlOptions: { otpAuthUrl: factor.totp.uri }
    });
    async function verify(tab, previous) {
      let value = await mail.mfaController.getTotpDeviceCode({ id: device.id });
      for (let tries = 0; tries < 4 && (value.code === previous || Date.parse(value.expiresAt) - Date.now() < 4000); tries++) {
        await pause(Math.max(1000, Math.min(31000, Date.parse(value.expiresAt) - Date.now() + 1000)) || 1000);
        value = await mail.mfaController.getTotpDeviceCode({ id: device.id });
      }
      if (value.code === previous) throw new Error('Expected a fresh authenticator code.');
      await tab.getByLabel('Authenticator code').fill(value.code);
      await tab.getByRole('button', { name: 'Verify authenticator' }).click();
      await expect(tab.locator('#level')).toHaveText('aal2');
      return value.code;
    }
    const first = await verify(page);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.locator('#login')).toBeVisible();
    const fresh = await browser.newContext();
    try {
      const tab = await fresh.newPage();
      await tab.goto(callback);
      await enterCredentials(tab, inbox, password);
      await tab.getByRole('button', { name: 'Sign in', exact:true }).click();
      await expect(tab.locator('#level')).toHaveText('aal1');
      await expect(tab.locator('#next')).toHaveText('aal2');
      await image(tab, 'before-challenge');
      await verify(tab, first);
      await tab.reload();
      await expect(tab.locator('#address')).toHaveAttribute('data-user-id', id);
      await expect(tab.locator('#level')).toHaveText('aal2');
      await image(tab, 'after-challenge');
    } finally { await fresh.close(); }
  } finally {
    try { if (device) await mail.mfaController.deleteTotpDevice({ id: device.id }); }
    finally { await mail.deleteInbox(inbox.id); }
  }
});
