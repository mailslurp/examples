import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { verificationLink } from './links.js';

test('new and returning users sign in through the message in their inbox', async ({ page, browser, baseURL }) => {
  if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY for the test runner.');
  const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
  const inbox = await mail.createInboxWithOptions({ expiresIn: 3600000, name: 'Supabase magic-link test' });
  const status = page.locator('p[role=status]');
  const cooldown = Number(process.env.AUTH_EMAIL_COOLDOWN_SECONDS || 65);
  try {
    await page.goto('/');
    for (const returning of [false, true]) {
      await expect(status).toHaveText('Signed out');
      await page.getByLabel('Email address').fill(inbox.emailAddress);
      const since = new Date();
      await page.getByRole('button', { name: 'Send sign-in link' }).click();
      await expect(status).toHaveText('Check your email', { timeout: 20000 });
      const message = await mail.waitController.waitForLatestEmail({
        inboxId: inbox.id, since, timeout: 90000, unreadOnly: true
      });
      const { links } = await mail.emailController.getEmailLinks({ emailId: message.id });
      const link = verificationLink(links, process.env.VITE_SUPABASE_URL, baseURL + '/');
      if (returning && new URL(link).searchParams.get('type') !== 'magiclink') {
        throw new Error('Expected a returning-user magic link.');
      }
      // Never include the one-time URL in an assertion or a shared trace.
      try { await page.goto(link); } catch { throw new Error('Verification navigation failed.'); }
      await expect(status).toHaveText('Signed in');
      expect(page.url() === baseURL + '/').toBe(true);
      await page.reload();
      await expect(page.getByLabel('Signed-in email')).toHaveText(inbox.emailAddress);
      if (returning && process.env.EXAMPLE_SCREENSHOT) {
        await page.locator('main').screenshot({ path: process.env.EXAMPLE_SCREENSHOT,
          mask: [page.locator('output')], maskColor: '#c6d4cc' });
      }
      const guest = await browser.newContext();
      try {
        const otherPage = await guest.newPage();
        await otherPage.goto(baseURL);
        await expect(otherPage.locator('p[role=status]')).toHaveText('Signed out');
      } finally { await guest.close(); }
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(status).toHaveText('Signed out');
      if (!returning) {
        const remaining = since.getTime() + cooldown * 1000 - Date.now();
        await new Promise(resolve => setTimeout(resolve, Math.max(0, remaining)));
      }
    }
  } finally { await mail.deleteInbox(inbox.id); }
});
