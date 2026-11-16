import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { captureEmail } from './capture-email.js';

function verificationLink(links, baseURL, realm) {
  const expected = new URL('/realms/' + realm + '/login-actions/action-token', baseURL);
  const matches = new Set(links.filter(link => {
    if (!URL.canParse(link)) return false;
    const url = new URL(link);
    return url.origin === expected.origin && url.pathname === expected.pathname &&
      !url.username && !url.password && url.searchParams.getAll('key').length === 1 &&
      Boolean(url.searchParams.get('key'));
  }));
  if (matches.size !== 1) throw new Error('Expected one Keycloak verification link for this realm.');
  return [...matches][0];
}

async function admin(baseURL, path, method = 'GET', body) {
  const token = await fetch(baseURL + '/realms/master/protocol/openid-connect/token', {
    method: 'POST', body: new URLSearchParams({
      grant_type: 'password', client_id: 'admin-cli', username: process.env.KC_BOOTSTRAP_ADMIN_USERNAME,
      password: process.env.KC_BOOTSTRAP_ADMIN_PASSWORD
    })
  });
  if (!token.ok) throw new Error('Local realm setup could not authenticate: HTTP ' + token.status);
  const response = await fetch(baseURL + '/admin/realms' + path, {
    method, headers: { Authorization: 'Bearer ' + (await token.json()).access_token, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Keycloak admin request failed: HTTP ' + response.status);
  if (method === 'GET') return response.json();
}

async function capture(panel, file, mask) {
  if (!process.env.SCREENSHOT_DIR) return;
  await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
  await panel.screenshot({path: join(process.env.SCREENSHOT_DIR, file), mask, maskColor:'#40594f'});
}

test('a delivered verification link confirms the same Keycloak user', async ({page, browser, baseURL}) => {
  const mail = new MailSlurp({apiKey: process.env.MAILSLURP_API_KEY});
  const realm = 'email-qa-' + randomUUID().slice(0,8);
  const account = baseURL + '/realms/' + realm + '/account/';
  const password = randomBytes(24).toString('base64url');
  const sender = await mail.createInboxWithOptions({inboxType:'SMTP_INBOX', expiresIn:3600000});
  let recipient;
  try {
    recipient = await mail.createInboxWithOptions({expiresIn:3600000});
    const smtp = await mail.getImapSmtpAccessDetails(sender.id);
    await admin(baseURL, '', 'POST', {
      realm, enabled:true, registrationAllowed:true, registrationEmailAsUsername:true, verifyEmail:true,
      displayName:'Example workspace', smtpServer:{
        host:smtp.secureSmtpServerHost, port:String(smtp.secureSmtpServerPort),
        ssl:'true', auth:'true', from:sender.emailAddress, fromDisplayName:'Example workspace',
        user:smtp.secureSmtpUsername, password:smtp.secureSmtpPassword
      }
    });
    async function readUser() {
      const query = new URLSearchParams({email:recipient.emailAddress, exact:'true'});
      const users = await admin(baseURL, '/' + realm + '/users?' + query);
      if (users.length !== 1 || users[0].email !== recipient.emailAddress) throw new Error('Expected the exact test user.');
      return users[0];
    }

    await page.goto(account);
    await page.getByRole('link', {name:'Register', exact:true}).click();
    await page.locator('#firstName').fill('Avery');
    await page.locator('#lastName').fill('Example');
    await page.locator('#email').fill(recipient.emailAddress);
    await expect(page.locator('input[type=password]')).toHaveCount(0);
    const since = new Date();
    await page.getByRole('button', {name:'Register', exact:true}).click();
    await expect(page.getByRole('heading', {name:'Email verification'})).toBeVisible();
    const before = await readUser();
    expect(before.emailVerified).toBe(false);
    await capture(page.locator('main'), 'verification-request.png', [page.getByText(recipient.emailAddress, {exact:false})]);

    const message = await mail.waitController.waitForLatestEmail({inboxId:recipient.id, since, timeout:90000});
    await captureEmail(browser, message);
    const {links} = await mail.emailController.getEmailLinks({emailId:message.id});
    const action = verificationLink(links, baseURL, realm);
    try { await page.goto(action); }
    catch { throw new Error('Could not open the delivered verification link.'); }
    await expect.poll(async () => (await readUser()).emailVerified).toBe(true);
    expect((await readUser()).id).toBe(before.id);
    await expect(page.locator('#password-new')).toBeVisible();
    await capture(page.locator('main'), 'set-password.png', []);
    await page.locator('#password-new').fill(password);
    await page.locator('#password-confirm').fill(password);
    await page.locator('form').filter({has:page.locator('#password-new')}).locator('[type=submit]').click();
    await expect(page.getByRole('heading', {name:'Personal info', exact:true})).toBeVisible();

    const fresh = await browser.newContext();
    try {
      const tab = await fresh.newPage();
      await tab.goto(account);
      await tab.locator('#username').fill(recipient.emailAddress);
      await tab.locator('#password').fill(password);
      await tab.locator('#kc-login').click();
      await expect(tab.getByRole('heading', {name:'Personal info',exact:true})).toBeVisible();
      const email = tab.getByLabel('Email', {exact:false}).first();
      await expect(email).toHaveValue(recipient.emailAddress);
      await tab.reload();
      await expect(email).toHaveValue(recipient.emailAddress);
      await capture(tab.getByRole('main'), 'verified-account.png', [email,tab.locator('input[name="username"]')]);
    } finally { await fresh.close(); }
  } finally {
    await Promise.all([sender,recipient].filter(Boolean).map(inbox => mail.deleteInbox(inbox.id)));
  }
});
