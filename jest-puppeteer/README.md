# Test user sign up with Jest, Puppeteer, and MailSlurp
An example repository showing how you can test email related processes with MailSlurp.

## About
`sign-up.test.js` uses Jest, Puppeteer and MailSlurp to open the MailSlurp test authentication app in a browser, create a new test email address, sign-up with that address and confirm the account.

It uses MailSlurp's `waitForLatestEmail` feature to fetch the confirmation email and extract the confirmation code. This code is then submitted in the browser and the user is confirmed.

## Setup
`npm install`

## Test
`API_KEY=your-api-key npm t`
