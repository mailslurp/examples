import { expect, test } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';

test('a code from the new inbox opens the expected Appwrite account', async ({ page }) => {
  if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY for the test runner.');
  const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
  const inbox = await mail.createInboxWithOptions({ expiresIn: 3600000, name: 'Appwrite email OTP test' });
  try {
    await page.goto('/');
    const status = page.locator('p[role=status]');
    await expect(status).toHaveText('Signed out');
    await page.getByLabel('Email address').fill(inbox.emailAddress);
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(status).toHaveText('Check your email', {timeout: 20000});
    if (process.env.EXAMPLE_CODE_SCREENSHOT) {
      await page.locator('main').screenshot({ path: process.env.EXAMPLE_CODE_SCREENSHOT });
    }
    const message = await mail.waitForLatestEmail(inbox.id, 90000, true);
    const { lines } = await mail.emailController.getEmailTextLines({ emailId: message.id });
    const codes = new Set(lines.join('\n').match(/\b\d{6}\b/g));
    if (codes.size !== 1) throw new Error('Expected one six-digit verification code in the delivered message.');
    await page.getByLabel('Verification code').evaluate((input, code) => { input.value = code; }, [...codes][0]);
    await page.getByRole('button', {name:'Verify code'}).click();
    await expect(status).toHaveText('Signed in');
    await page.reload();
    await expect(page.getByLabel('Signed-in email')).toHaveText(inbox.emailAddress);
    if (process.env.EXAMPLE_SCREENSHOT) {
      await page.locator('main').screenshot({ path: process.env.EXAMPLE_SCREENSHOT, mask: [page.locator('output')], maskColor: '#c6d4cc' });
    }
    await page.getByRole('button', { name:'Sign out' }).click();
    await expect(status).toHaveText('Signed out');
  } finally { await mail.deleteInbox(inbox.id); }
});
