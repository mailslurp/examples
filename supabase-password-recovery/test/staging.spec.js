import { randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { verificationLink } from './links.js';

const status = page => page.locator('p[role=status]');
const makePassword = () => 'Aa1!' + randomBytes(24).toString('base64url');

test('a delivered recovery email replaces the password of the expected user', async ({ browser, baseURL }) => {
  if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY on the test runner.');
  const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
  const inbox = await mail.createInboxWithOptions({ name:'Password recovery test', expiresIn:3600000 });
  const oldPassword = makePassword();
  const newPassword = makePassword();

  async function visit(path, run) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(new URL(path, baseURL).href);
      await expect(status(page)).toHaveText('Signed out');
      await run(page);
    } finally { await context.close(); }
  }
  async function credentials(page, password) {
    await page.getByLabel('Email address').fill(inbox.emailAddress);
    await page.getByLabel('Password', { exact:true }).evaluate((el, value) => { el.value = value; }, password);
  }
  async function useMessage(page, since, action) {
    const email = await mail.waitController.waitForLatestEmail({ inboxId:inbox.id, since, unreadOnly:true, timeout:90000 });
    const { links } = await mail.emailController.getEmailLinks({ emailId:email.id });
    const link = verificationLink(links,process.env.VITE_SUPABASE_URL,baseURL + '/',action);
    // Avoid putting a one-time URL in failure messages.
    try { await page.goto(link); } catch { throw new Error('Email verification navigation failed.'); }
  }
  async function signOut(page) {
    await page.getByRole('button',{name:'Sign out'}).click();
    await expect(status(page)).toHaveText('Signed out');
  }
  try {
    const signupTime = new Date();
    await visit('/?view=signup', async page => {
      await credentials(page,oldPassword);
      await page.getByRole('button',{name:'Create account'}).click();
      await expect(status(page)).toHaveText('Check your signup email');
      await useMessage(page,signupTime,'signup');
      await expect(page.getByLabel('Account email')).toHaveText(inbox.emailAddress);
      await signOut(page);
    });
    await visit('/', async page => {
      await credentials(page,oldPassword);
      await page.getByRole('button',{name:'Sign in'}).click();
      await expect(page.getByLabel('Account email')).toHaveText(inbox.emailAddress);
      await signOut(page);
    });
    const interval = Number(process.env.AUTH_EMAIL_COOLDOWN_SECONDS || 65) * 1000;
    await new Promise(resolve => setTimeout(resolve, Math.max(0, signupTime.getTime() + interval - Date.now())));
    await visit('/', async page => {
      await page.getByRole('link',{name:'Forgot password?'}).click();
      await page.getByLabel('Email address').fill(inbox.emailAddress);
      const since = new Date();
      await page.getByRole('button',{name:'Send recovery email'}).click();
      await expect(status(page)).toHaveText('If an account exists, check your email.');
      await useMessage(page,since,'recovery');
      await expect(status(page)).toHaveText('Recovery link verified');
      await page.getByLabel('New password').evaluate((el,value) => { el.value = value; },newPassword);
      await page.getByRole('button',{name:'Save new password'}).click();
      await expect(status(page)).toHaveText('Your new password has been saved.');
      await signOut(page);
    });
    await visit('/', async page => {
      await credentials(page,oldPassword);
      await page.getByRole('button',{name:'Sign in'}).click();
      await expect(status(page)).toHaveText('Invalid sign-in credentials');
    });
    await visit('/', async page => {
      await credentials(page,newPassword);
      await page.getByRole('button',{name:'Sign in'}).click();
      await expect(status(page)).toHaveText('Signed in');
      await page.reload();
      await expect(page.getByLabel('Account email')).toHaveText(inbox.emailAddress);
      await signOut(page);
    });
  } finally { await mail.deleteInbox(inbox.id); }
});
