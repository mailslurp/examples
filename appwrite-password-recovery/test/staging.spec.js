import { randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { recoveryLink } from './links.js';

const password = () => 'Az1!' + randomBytes(24).toString('base64url');
const status = page => page.locator('p[role=status]');

test('the delivered recovery link replaces the password for the same Appwrite account', async ({ browser, baseURL }) => {
  if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY on the test runner.');
  const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
  const inbox = await mail.createInboxWithOptions({ name: 'Appwrite password recovery', expiresIn: 3600000 });
  const oldPassword = password();
  const newPassword = password();
  let accountId;

  async function freshBrowser(run) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(baseURL);
      await expect(status(page)).toHaveText('Signed out');
      await run(page);
    } finally {
      await context.close();
    }
  }
  async function enterPassword(page, label, value) {
    await page.getByLabel(label, { exact: true }).evaluate((input, secret) => { input.value = secret; }, value);
  }
  async function signIn(page, credential) {
    await page.getByLabel('Email address').fill(inbox.emailAddress);
    await enterPassword(page, 'Password', credential);
    await page.getByRole('button', { name: 'Sign in' }).click();
  }
  async function signOut(page) {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(status(page)).toHaveText('Signed out');
  }
  const accountRead = page => page.waitForResponse(response =>
    new URL(response.url()).pathname.endsWith('/account') &&
    response.request().method() === 'GET' && response.status() === 200);

  try {
    await freshBrowser(async page => {
      await page.getByRole('link', { name: 'Create account' }).click();
      await page.getByLabel('Email address').fill(inbox.emailAddress);
      await enterPassword(page, 'Password', oldPassword);
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(status(page)).toHaveText('Account created. Sign in to continue.');
      const accountResponse = accountRead(page);
      await signIn(page, oldPassword);
      accountId = (await (await accountResponse).json()).$id;
      expect(accountId).toBeTruthy();
      await expect(page.getByLabel('Account email')).toHaveText(inbox.emailAddress);
      await signOut(page);
    });
    await freshBrowser(async page => {
      await page.getByRole('link', { name: 'Forgot password?' }).click();
      await page.getByLabel('Email address').fill(inbox.emailAddress);
      const since = new Date();
      await page.getByRole('button', { name: 'Send recovery email' }).click();
      await expect(status(page)).toHaveText('Check your email for a password reset link.');
      const email = await mail.waitController.waitForLatestEmail({ inboxId: inbox.id, since, unreadOnly: true, timeout: 90000 });
      const { links } = await mail.emailController.getEmailLinks({ emailId: email.id });
      const link = recoveryLink(links, new URL('/recover', baseURL));
      expect(new URL(link).searchParams.get('userId') === accountId).toBe(true);
      try { await page.goto(link); } catch { throw new Error('Recovery callback could not be opened.'); }
      await expect(page.getByLabel('New password')).toBeVisible();
      await enterPassword(page, 'New password', newPassword);
      await page.getByRole('button', { name: 'Save new password' }).click();
      await expect(status(page)).toHaveText('You can now sign in with your new password.');
    });
    await freshBrowser(async page => {
      await signIn(page, oldPassword);
      await expect(status(page)).toHaveText('Invalid sign-in credentials');
      await expect(page.getByLabel('Account email')).toBeEmpty();
    });
    await freshBrowser(async page => {
      await signIn(page, newPassword);
      await expect(status(page)).toHaveText('Signed in');
      const accountResponse = accountRead(page);
      await page.reload();
      expect((await (await accountResponse).json()).$id === accountId).toBe(true);
      await expect(page.getByLabel('Account email')).toHaveText(inbox.emailAddress);
      await signOut(page);
    });
  } finally {
    await mail.deleteInbox(inbox.id);
  }
});
