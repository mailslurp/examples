# Webdriver.io MailSlurp Example
This example demonstrates use of MailSlurp with NodeJS, Webdriver.io (wdio), Selenium and Chrome.

It tests user sign-up, email confirmation, login, and password reset using the [MailSlurp Playground](https://playground.mailslurp.com) as a dummy application.

### Run
`npm install`
`API_KEY=your-mailslurp-key npm run test`

### Notes
The version of `chromedriver` in package.json should match the version of Chrome browser that you have installed on your machine. Check your installed version and change the dependency version to match.
