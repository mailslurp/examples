# MailSlurp UiPath Studio example
Testing user sign up and verification using disposable emails in UiPath studio.

## About
This folder contains an example project created in UiPath Studio that uses the [MailSlurp API](https://api.mailslurp.com) to create and control disposable email accounts in order to test an website's user sign-up and confirmation process.

## Setup
- Download project on Windows machine
- Install UiPath Chrome extension
- Create an [MailSlurp API Key](https://app.mailslurp.com/)
- Import the project into UiPath studio
- Set the `MailSlurpApiKey` variable to your API Key
- Run the automation

## How it works
This test relies on Chrome automation to load and interact with a demo app hosted at [playground.mailslurp.com](https://playground.mailslurp.com). This application has a user creation form that accepts an email account. Once submitted an email confirmation code is sent to the email address. This code must be extracted and submitted to the app to verify a new user account.

The steps for testing this are:

  1. Make an HTTP request to the MailSlurp API [REST endpoints](https://docs.mailslurp.com/api/) to create a unique disposable inbox.
  2. Submit this email address using the Chrome UI automation
  3. Call the [waitForLatestEmail](https://docs.mailslurp.com/waitFor) endpoints to wait for the confirmation code
  4. We then extract the code and submit it to confirm the user using the Chrome automation.

  Please import the project and inspect the HTTP requests and stages to see how it works. For more information see the [developer documentation](https://docs.mailslurp.com).
