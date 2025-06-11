import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';

const mailslurp = new MailSlurp({ apiKey: process.env.API_KEY });
test('test mfa using auth0 totp flow', async ({ page }) => {
  const inbox = await mailslurp.createInbox();
  const tempEmail = inbox.emailAddress;

  await page.goto('http://localhost:3000/#/');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Sign up' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(tempEmail);
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('testpassword1234!L');
  await page.getByRole('button', { name: 'Show password' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('button', { name: 'Trouble Scanning?' }).click();
  await page.getByRole('button', { name: 'Copy code' }).click();
  await page.waitForTimeout(1000);
  const secret = await page.evaluate(() => {
    return window.getSelection()?.toString() || '';
  });
  const totpDevice = await mailslurp.mfaController.createTotpDeviceForBase32SecretKey({ 
    createTotpDeviceBase32SecretKeyOptions: {
      base32SecretKey: secret,
    }
   });
   const otpCode = await mailslurp.mfaController.getTotpDeviceCode({
    id: totpDevice.id,
    minSecondsUntilExpire: 10
   })

  await page.getByRole('textbox', { name: 'Enter your one-time code' }).fill(otpCode.code);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Accept' }).click();
});