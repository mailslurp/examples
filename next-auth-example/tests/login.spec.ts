import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';

const apiKey = process.env.API_KEY ?? '';

test('can login using magic link', async ({ page }) => {
  expect(apiKey, "MailSlurp API_KEY env should be set").toBeTruthy()
  // create an inbox for sign up
  const mailslurp = new MailSlurp({ apiKey })
  const userInbox = await mailslurp.createInbox()
  // load the app
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Playwright/);

  // wait for the login link
  const email = await mailslurp.waitForLatestEmail(userInbox.id)
  expect(email.body).toEqual(123)
});