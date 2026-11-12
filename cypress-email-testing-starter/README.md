# Cypress email testing starter

Test the emails your app sends during sign-up, login and password reset, using real throwaway inboxes from a free MailSlurp account.

Before each test, the `cypress-mailslurp` plugin creates a new email address. The test fills in your form with that address, waits for the email, reads the link or code from it and finishes the flow in the browser. Because every test has its own inbox, tests never pick up each other's mail.

## What's included

- `cypress/e2e/magic-link.cy.ts`: requests a magic link, waits for the email, opens the link and checks that the user is signed in.
- `cypress/support/e2e.ts`: loads the plugin, which adds `cy.mailslurp()`.
- `ci/github-actions.yml`: a GitHub Actions workflow you can copy into your repository.

The test runs against MailSlurp's public demo app, so it works before you point it at your own app.

## Run it

1. Create a free MailSlurp account at https://app.mailslurp.com/sign-up/ (no card needed) and copy your API key from the dashboard.
2. Install and run:

```bash
npm install
cp .env.example .env   # then paste your API key into .env
npx cypress run --browser chrome
```

The free plan includes 100 temporary inboxes and 250 received emails a month, which is enough to run these tests locally and in CI.

## Use it on your own app

1. Change `baseUrl` in `cypress.config.ts` to your app.
2. Add `import 'cypress-mailslurp'` to your support file.
3. Create an inbox in `beforeEach`, and fill your form with its email address.
4. Call `mailslurp.waitForLatestEmail(inboxId, 60_000, true)` inside `cy.mailslurp().then(...)`. Give that `.then` a longer timeout than the wait, as the example does.

## More

- Cypress plugin guide: https://www.mailslurp.com/docs/cypress-mailslurp/
- Waiting for emails, timeouts and matching: https://www.mailslurp.com/docs/wait-for/
- Playwright version of these tests: [../playwright-email-testing-starter](../playwright-email-testing-starter)
