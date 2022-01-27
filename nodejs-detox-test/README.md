# NodeJS Detox email test example

![detox](https://www.mailslurp.com/assets/detox.png)

Detox is an end-to-end test runner [from Wix](https://wix.github.io/Detox/docs/introduction/getting-started/) that is similar to [Cypress](https://www.mailslurp.com/examples/cypress-js/) and [Selenium](https://www.mailslurp.com/examples/receive-emails-in-java-selenium-tests/)
You can use Detox to test mobile applications. It is cross-platform and pluggable with different Javascript based test runners. With MailSlurp's SDK you can create real email addresses in tests to send and receive email verifications and login codes during testing. In this example we will cover how to test user sign up and login processes using Detox and Jest.

## Install Detox 
Make sure you have [NodeJS](https://nodejs.org/en/download/) installed then run:

```bash
npm install detox --save-dev
```

Then add a configuration file `.detoxrc.json` or run the command `detox init`.