# Cypress MailSlurp SMS example

Sign up to the SMS playground with an existing US phone number, receive the verification SMS, confirm the code, and sign in.

Uses `cypress-mailslurp@2.0.0` and Cypress 16. The plugin requires Cypress 15.10 or newer for its secure `cy.env()` API. Install a supported Node.js version and Google Chrome before running.

## Run tests

Put `API_KEY=your-api-key` in this directory's `.env` or the shared `examples/.env`. The config loads it in Node and makes it available to the plugin without putting the key in the test source. An exported `CYPRESS_MAILSLURP_API_KEY` takes precedence.

```sh
npm ci
npm run typecheck
npm test
```

`make test` runs the same Chrome tests. Use `npm run dev` for the interactive Cypress runner.

The account needs an existing US MailSlurp number that has not already registered with the SMS playground. This example does not purchase a number. The test fails with an actionable message if no US number is available.

Signup, SMS confirmation, and login stay in one test because Cypress resets aliases between tests. The SMS wait filters messages received since this run began, preventing an older unread code from being used.

## Documentation

- [Cypress Plugin source](https://github.com/mailslurp/cypress-mailslurp)
- [Plugin documentation](https://docs.mailslurp.com/cypress-mailslurp)

## Example test

{{{<gen_typescript_cypress_sms_full>}}}
