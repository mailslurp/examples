import { test, expect } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { writeFile } from 'fs/promises'
import path from 'path';
const apiKey = process.env.API_KEY ?? '';
const absolutePath = path.resolve(`${__dirname}/body.html`)

test('can login using magic link', async ({ page }) => {
  expect(apiKey, "MailSlurp API_KEY env should be set").toBeTruthy()
  // create an inbox for sign up
  const mailslurp = new MailSlurp({ apiKey })
  const userInbox = await mailslurp.createInbox()

  await page.goto('http://localhost:3000/');
  await page.screenshot({ path: `screenshots/01-welcome.jpeg` });

  // load the app and try access
  await page.goto('http://localhost:3000/protected/');
  await page.waitForSelector('[data-id="access-denied"]')
  await page.screenshot({ path: `screenshots/02-access-denied.jpeg` });

  // now login
  await page.click('[data-id="access-link"]')
  await page.waitForURL(/signin/);

  // try sign in with email
  await page.fill('#input-email-for-email-provider', userInbox.emailAddress)
  await page.screenshot({ path: `screenshots/03-sign-in.jpeg` });
  await page.click('#submitButton')
  await page.waitForURL(/verify-request/)
  await page.screenshot({ path: `screenshots/04-verify.jpeg` });

  // wait for the login link and extract it
  const email = await mailslurp.waitForLatestEmail(userInbox.id)
  await writeFile(absolutePath, email.body!!)
  const { links: [loginLink] } = await mailslurp.emailController.getEmailLinks({
    emailId: email.id,
  })
  expect(loginLink).toContain('localhost');
  await page.goto('file://' + absolutePath)
  await page.screenshot({ path: `screenshots/05-email.jpeg` });

  // now go to link
  await page.goto(loginLink)
  await page.waitForSelector('[data-id="access-permitted"]')
  await page.screenshot({ path: `screenshots/06-access.jpeg` });
});