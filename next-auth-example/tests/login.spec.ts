import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';

const apiKey = process.env.API_KEY ?? '';

test('can login using magic link', async ({ page }) => {
  expect(apiKey, "MailSlurp API_KEY env should be set").toBeTruthy()
  // create an inbox for sign up
  const mailslurp = new MailSlurp({ apiKey })
  const userInbox = await mailslurp.createInbox()

  // load the app and try access
  await page.goto('http://localhost:3000/protected/');
  await page.waitForSelector('[data-id="access-denied"]')

  // now login
  await page.click('[data-id="access-link"]')
  await page.waitForURL(/signin/);

  // try sign in with email
  await page.fill('#input-email-for-email-provider', userInbox.emailAddress)
  await page.click('#submitButton')
  await page.waitForSelector(/verify-request/)

  // wait for the login link
  const email = await mailslurp.waitForLatestEmail(userInbox.id)
  expect(email.body).toEqual(123)
});