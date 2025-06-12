import { test, expect } from '@playwright/test';
//<gen>totp_playwright_00_import
import { MailSlurp } from 'mailslurp-client';
//</gen>

const base = './screenshots'
const APP_URL = 'http://localhost:3000/#/'
test('test mfa using auth0 totp flow', async ({ page }) => {
  //<gen>totp_playwright_01_create_inbox
  const mailslurp = new MailSlurp({ apiKey: process.env.API_KEY });
  const inbox = await mailslurp.createInbox();
  const tempEmail = inbox.emailAddress;
  //</gen>
  //<gen>totp_playwright_02_load_app
  await page.goto(APP_URL);
  //<gen-ignore>
  await page.getByRole('button', { name: 'Login' }).waitFor({
    state: 'attached'
  })
  await page.screenshot({
    path: `${base}/totp_playwright_01_load_app.png`,
  })
  //</gen-ignore>
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Sign up' }).click();
  //</gen>
  //<gen>totp_playwright_03_signup_fill
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(tempEmail);
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('testpassword1234!L');
  await page.getByRole('button', { name: 'Show password' }).click();
  //<gen-ignore>
  await page.screenshot({
    path: `${base}/totp_playwright_02_signup.png`,
  })
  //</gen-ignore>
  await page.getByRole('button', { name: 'Continue' }).click();
  //</gen>

  //<gen>totp_playwright_04_secret_view
  // click the "trouble scanning" button to reveal the secret key
  await page.getByRole('button', { name: 'Trouble Scanning?' }).click();
  await page.getByRole('button', { name: 'Copy code' }).click();
  //<gen-ignore>
  await page.screenshot({
    path: `${base}/totp_playwright_03_copy_code.png`,
  })
  //</gen-ignore>
  // once secret is highlighted, copy the text from the browser
  await page.waitForTimeout(1000);
  const secret = await page.evaluate(() => {
    return window.getSelection()?.toString() || '';
  });
  //</gen>

  //<gen>totp_playwright_05_create_device_get_code
  const totpDevice = await mailslurp.mfaController.createTotpDeviceForBase32SecretKey({
    createTotpDeviceBase32SecretKeyOptions: {
      base32SecretKey: secret,
    }
   });
   const otpCode = await mailslurp.mfaController.getTotpDeviceCode({
    id: totpDevice.id,
    minSecondsUntilExpire: 10
   })
  //</gen>

  //<gen>totp_playwright_06_submit_code
  await page.getByRole('textbox', { name: 'Enter your one-time code' }).fill(otpCode.code);
  //<gen-ignore>
  await page.screenshot({
    path: `${base}/totp_playwright_04_enter_code.png`,
  })
  //</gen-ignore>
  await page.getByRole('button', { name: 'Continue' }).click();
  //<gen-ignore>
  await page.getByRole('button', { name: 'Accept' }).waitFor({
    state: 'attached'
  })
  await page.screenshot({
    path: `${base}/totp_playwright_04_enter_code.png`,
  })
  //</gen-ignore>
  // accept connection
  await page.getByRole('button', { name: 'Accept' }).click();
  //</gen>
});