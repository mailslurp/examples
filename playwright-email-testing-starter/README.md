# Playwright email testing starter

Test the emails your app sends during sign-up, login and password reset, using real throwaway inboxes from a free MailSlurp account.

Each test gets its own email address from a Playwright fixture. The test fills in your form with that address, waits for the email to arrive, reads the code or link from it and finishes the flow in the browser. Because every test has its own inbox, tests can run in parallel without reading each other's mail.

## What's included

- `tests/fixtures.ts`: `mailslurp` and `inbox` fixtures. Each test gets a fresh inbox that expires after ten minutes.
- `tests/magic-link.spec.ts`: requests a magic link, waits for the email, opens the link and checks that the user is signed in.
- `tests/parallel-users.spec.ts`: three users sign up at the same time, and each one receives only their own link.
- `ci/github-actions.yml`: a GitHub Actions workflow you can copy into your repository.

The tests run against MailSlurp's public demo app, so they work before you point them at your own app.

## Run it

1. Create a free MailSlurp account at https://app.mailslurp.com/sign-up/ (no card needed) and copy your API key from the dashboard.
2. Install and run:

```bash
npm install
npx playwright install chromium
cp .env.example .env   # then paste your API key into .env
npx playwright test
```

The free plan includes 100 temporary inboxes and 250 received emails a month, which is enough to run these tests locally and in CI.

## Use it on your own app

1. Change `baseURL` in `playwright.config.ts` to your app.
2. Copy `tests/fixtures.ts` into your project and import `test` from it instead of `@playwright/test`.
3. In your test, fill your sign-up form with `inbox.emailAddress`, then call `mailslurp.waitForLatestEmail(inbox.id, 60_000, false)`. A new inbox per test means its latest email is the one the test requested; if tests share an inbox, use `waitForMatchingFirstEmail` with a `since` time and a subject match instead.
4. Read what you need from the email:
   - for a link, use `mailslurp.emailController.getEmailLinks({ emailId, selector })`;
   - for a code, match it in `email.body`.

## More

- Playwright guide: https://www.mailslurp.com/docs/playwright/
- Waiting for emails, timeouts and matching: https://www.mailslurp.com/docs/wait-for/
- Cypress version of these tests: [../cypress-email-testing-starter](../cypress-email-testing-starter)
