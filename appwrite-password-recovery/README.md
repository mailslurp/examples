# Appwrite password recovery with Playwright

Test a password change from the email a user receives. The example signs in with the original password, requests a recovery link while signed out, follows the link, and saves a replacement. Two fresh Chromium contexts then try the original and replacement passwords. The test reloads the successful session and checks the Appwrite account ID and email against the original user.

## Run the example

1. Use a dedicated Appwrite project with email/password authentication enabled. Register a Web platform for the hostname `localhost`. The sample supplies `http://localhost:4174/recover` as the callback. Use an Appwrite installation configured to send email and a MailSlurp API key with access to create, read and delete test inboxes.
2. Install Node.js 22.12 or later. In this directory run:

   ```sh
   npm ci
   npx playwright install chromium
   cp .env.example .env.local
   ```

3. Fill in the regional Appwrite endpoint (including `/v1`), project ID and MailSlurp key. Only the two Appwrite settings have a `VITE_` prefix. The MailSlurp key stays on the Node runner.
4. Run `npm test` for the offline link checks and `npm run test:staging` for the real email and browser flow. To try the app manually, run `npm run dev` and visit `http://localhost:4174`.

## What the test checks

- One new inbox and account per run. The original password signs in before the reset.
- The email received after the request contains a link to the exact callback with the expected user ID and a nonempty secret.
- The callback passes the delivered values and the new password to `account.updateRecovery`.
- A fresh browser sees a credentials-specific rejection when using the original password. A different fresh browser signs in with the replacement and reads the same account after reload.

The runner deletes the inbox on completion. Appwrite retains the test user in your staging project. The included images show a real run with the test address and project name masked. Avoid saving traces of one-time URLs or password submissions in shared CI logs.

[Appwrite email and password authentication](https://appwrite.io/docs/products/auth/email-password) · [MailSlurp email waits](https://www.mailslurp.com/docs/wait-for/)
