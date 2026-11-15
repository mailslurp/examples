import { expect } from '@playwright/test';

export async function checkPreview({ browser, mail, inbox, origin, otherOrigin }) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(origin);
    await page.getByLabel('Email').fill(inbox.emailAddress);
    const since = new Date();
    await page.getByRole('button',{name:'Send link'}).click();
    await expect(page.getByRole('status')).toHaveText('Check your email',{timeout:20000});
    const message = await mail.waitController.waitForLatestEmail({inboxId:inbox.id, since, timeout:60000, unreadOnly:true});
    const {links} = await mail.emailController.getEmailLinks({emailId:message.id});
    const candidates = links.map(href => new URL(href)).filter(u => u.pathname === '/api/auth/magic-link/verify');
    if (candidates.length !== 1 || candidates[0].origin !== origin ||
        candidates[0].searchParams.get('callbackURL') !== '/account') {
      throw new Error('Delivered link does not belong to the requesting preview.');
    }
    try { await page.goto(candidates[0].href); } catch { throw new Error('Preview verification failed.'); }
    expect(page.url() === origin + '/account').toBe(true);
    const account = await page.reload();
    expect(account.status()).toBe(200);
    expect((await account.json()).email).toBe(inbox.emailAddress);
    const other = await page.goto(otherOrigin + '/account');
    expect(other.status()).toBe(401);
  } finally { await context.close(); }
}
