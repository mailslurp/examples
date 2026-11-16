import { randomBytes, randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { MailSlurp } from 'mailslurp-client';

test.beforeAll(async () => {
  await clerkSetup({ publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY });
});

async function signup(page, email, getCode) {
  await setupClerkTestingToken({ page });
  await page.goto('/account');
  await expect(page).toHaveURL(/\/sign-up/);
  await page.locator('input[name=emailAddress]').fill(email);
  const password = page.locator('input[name=password]');
  if (await password.isVisible()) await password.fill(randomBytes(20).toString('base64url') + 'aA1!');
  const since = new Date();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const input = page.getByRole('textbox', { name: /verification code/i });
  await expect(input).toBeVisible({ timeout: 20000 });
  const code = await getCode(since);
  await input.pressSequentially(code);
  await page.waitForURL('**/account');
  await page.reload();
  await expect(page.getByLabel('Account email')).toHaveText(email);
  await expect(page.getByText('verified', { exact: true })).toBeVisible();
}

test('reserved test identity verifies with the development code', async ({ page }) => {
  await signup(page, randomUUID() + '+clerk_test@example.com', async () => '424242');
});

test('real signup uses the code delivered to the new inbox', async ({ page }) => {
  if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY for the delivery test.');
  const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
  const inbox = await mail.createInboxWithOptions({ expiresIn: 3600000, name: 'Clerk verification' });
  try {
    await signup(page, inbox.emailAddress, async since => {
      const email = await mail.waitController.waitForLatestEmail({ inboxId: inbox.id, since, timeout: 90000 });
      const { lines } = await mail.emailController.getEmailTextLines({ emailId: email.id });
      const digits = new Set(lines.join('\n').match(/\b\d{6}\b/g));
      if (digits.size !== 1) throw new Error('Expected one verification code in the email.');
      return [...digits][0];
    });
  } finally {
    await mail.deleteInbox(inbox.id);
  }
});
