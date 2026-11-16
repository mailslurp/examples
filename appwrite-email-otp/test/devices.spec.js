import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

test('sign out other devices keeps only the requesting session', async ({page, browser, baseURL}) => {
  const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
  const inbox = await mail.createInboxWithOptions({ expiresIn: 3600000, name: 'Appwrite two-browser test' });
  const other = await browser.newContext();
  async function login(tab) {
    await tab.goto(baseURL);
    await tab.getByLabel('Email address').fill(inbox.emailAddress);
    const since = new Date();
    await tab.getByRole('button', {name:'Send code'}).click();
    await expect(tab.locator('p[role=status]')).toHaveText('Check your email', {timeout:20000});
    const message = await mail.waitController.waitForLatestEmail({inboxId:inbox.id, since, unreadOnly:true, timeout:90000});
    const { lines } = await mail.emailController.getEmailTextLines({emailId:message.id});
    const codes = new Set(lines.join('\n').match(/\b\d{6}\b/g));
    if (codes.size !== 1) throw new Error('Expected a single distinct code in this email.');
    await tab.getByLabel('Verification code').fill([...codes][0]);
    await tab.getByRole('button',{name:'Verify code'}).click();
    await expect(tab.getByLabel('Signed-in email')).toHaveText(inbox.emailAddress);
  }
  async function capture(tab, name) {
    if (!process.env.SCREENSHOT_DIR) return;
    await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
    await tab.locator('main').screenshot({
      path:path.join(process.env.SCREENSHOT_DIR,name+'.png'),
      mask:[tab.locator('output:visible')], maskColor:'#40594f'
    });
  }
  try {
    const second = await other.newPage();
    await login(page);
    await login(second);
    await page.getByRole('button',{name:'Check active sessions'}).click();
    await expect(page.locator('#session-count')).toHaveText('2');
    await capture(page, 'two-devices');
    await page.getByRole('button',{name:'Sign out other devices'}).click();
    await expect(page.locator('#session-count')).toHaveText('1');
    // Each reload calls account.get() with that browser's own session.
    await second.reload();
    await expect(second.locator('p[role=status]')).toHaveText('Signed out');
    await expect(second.getByRole('button',{name:'Send code'})).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Signed-in email')).toHaveText(inbox.emailAddress);
    await page.getByRole('button',{name:'Check active sessions'}).click();
    await expect(page.locator('#session-count')).toHaveText('1');
    await capture(page, 'remaining-device');
    await page.getByRole('button',{name:'Sign out', exact:true}).click();
    await expect(page.locator('p[role=status]')).toHaveText('Signed out');
  } finally {
    await other.close();
    await mail.deleteInbox(inbox.id);
  }
});
