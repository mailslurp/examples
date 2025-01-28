# Test Emails in Cypress JS

See [/cypress/e2e/example.cy.js](/cypress/e2e/example.cy.js) for usage.

**Note:** the test uses `mailslurp-client` and adds custom commands in the `support/commands.js` file.

## Setup
First get a MailSlurp API Key then install the dependencies:

`npm init -y`
`npm install --save mailslurp-client cypress`

## Run
To run these tests set the environment variable `CYPRESS_API_KEY` to your MailSlurp API Key.

```bash
CYPRESS_API_KEY="your-mailslurp-api-key" npm run test`
```

