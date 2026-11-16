import { expect, test } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';

test('the original recipient can finish sign-in in a different browser', async ({ browser, page, baseURL }) => {
  if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY on the runner.');
  const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
  const inbox = await mail.createInboxWithOptions({ expiresIn: 3600000, name: 'Firebase cross-browser sign-in' });
  const second = await browser.newContext();
  try {
    await page.goto('/');
    const status = page.getByRole('status').first();
    await expect(status).toHaveText('Signed out');
    await page.getByLabel('Email address').fill(inbox.emailAddress);
    const since = new Date();
    await page.getByRole('button', { name: 'Send sign-in link' }).click();
    await expect(status).toHaveText('Check your email for a sign-in link.', { timeout: 20000 });
    const email = await mail.waitController.waitForLatestEmail({ inboxId: inbox.id, since, timeout: 90000 });
    const { links } = await mail.emailController.getEmailLinks({ emailId: email.id });
    const matches = links.map(link => new URL(link)).filter(url =>
      url.origin === 'https://' + process.env.VITE_FIREBASE_AUTH_DOMAIN &&
      url.pathname === '/__/auth/action' && url.searchParams.get('mode') === 'signIn' &&
      url.searchParams.get('oobCode') && url.searchParams.get('continueUrl') === baseURL + '/');
    if (matches.length !== 1) throw new Error('Expected one Firebase sign-in link for this app.');
    const receiver = await second.newPage();
    try { await receiver.goto(matches[0].href); } catch { throw new Error('Could not open the email action.'); }
    await expect(receiver.getByRole('button', { name: 'Confirm email' })).toBeVisible();
    expect(new URL(receiver.url()).origin === baseURL).toBe(true);
    await expect(receiver.getByLabel('Email address')).toHaveValue('');
    await receiver.getByLabel('Email address').fill(inbox.emailAddress);
    await receiver.getByRole('button', { name: 'Confirm email' }).click();
    await expect(receiver.getByLabel('Account email')).toHaveText(inbox.emailAddress);
    await receiver.reload();
    await expect(receiver.getByLabel('Account email')).toHaveText(inbox.emailAddress);
    await page.reload();
    await expect(status).toHaveText('Signed out');
    await receiver.getByRole('button', { name: 'Sign out' }).click();
    await expect(receiver.getByRole('button', { name: 'Send sign-in link' })).toBeVisible();
  } finally {
    await second.close();
    await mail.deleteInbox(inbox.id);
  }
});
