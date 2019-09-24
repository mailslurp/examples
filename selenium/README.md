# MailSlurp Selenium Example
A test of user sign-up flows that require email confirmation.

[Show me the code](https://github.com/mailslurp/examples/blob/master/selenium/src/test/java/com/mailslurp/examples/SeleniumIntegrationTest.java).

Uses Selenium Junit tests that use MailSlurp to sign-up and confirm a user in a test application.

The test application used is MailSlurp's dummy authentication app call [Playgroud](https://playground.mailslurp.com). Playground let's people sign up with an email address. It then sends an email containing a confirmation code. The confirmation code must then be entered before the user can login. 

## Run
Create a `.env` file with the following:

```.env
API_KEY=your-mailslurp-api-key
WEBSITE_URL=https://playground.mailslurp.com
```

Then run `make test`.
