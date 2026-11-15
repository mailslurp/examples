# Test Appwrite phone sign-in with MailSlurp

A small TypeScript web app and a Playwright test for a two-step phone login. The browser requests a phone token, exchanges a code for a session, reads the authenticated account, and ends its session. In the real SMS test, only the Node.js test runner can access MailSlurp.

Start with [the tutorial](TUTORIAL.md) for the walkthrough. To run it, use Node.js 22.12 or later, npm, and a free local port 4173. From this folder:

```sh
npm ci
npx playwright install chromium
npm test
```

On a Linux CI runner use `npx playwright install --with-deps chromium`. The default test starts its own loopback web server and needs no service credentials. Expect **five passing tests**: existing-user sign-in and logout, the SMS-to-session flow through both SDKs, an incorrect code, a session for the wrong account, and filtering stale or ambiguous messages. The local suite uses simulated responses. Run the SMS command against a supported staging number to check carrier delivery.

## Run against Appwrite staging

1. Use a staging project with Phone authentication enabled. Register a Web platform with hostname `localhost`. Copy the regional API endpoint **including /v1** and the project ID from the Appwrite console.
2. Copy `.env.example` to `.env`. Fill in `VITE_APPWRITE_ENDPOINT` and `VITE_APPWRITE_PROJECT_ID`. These are public client settings. Keep all other fields on the test runner. An Appwrite API key is unnecessary.
3. Choose one of the following runs. Each uses a fresh Chromium context. The scripts start and stop the local Vite server automatically.

| Command | Additional settings | What it checks |
| --- | --- | --- |
| `npm run test:mock` | `APPWRITE_MOCK_PHONE`, `APPWRITE_MOCK_CODE` | Exchanges the fixed code configured for this number and reads the authenticated user from Appwrite. |
| `npm run test:sms` | `MAILSLURP_API_KEY`, `MAILSLURP_PHONE_ID`, `APPWRITE_SMS_MARKER` | Looks up a dedicated number, requests a token, waits for a newly delivered matching SMS, and signs in. A run requests one billable OTP from the configured provider. |

**Mock number.** In the Appwrite console, open Auth → Settings → Mock phone numbers and save a test number with a fixed OTP. Copy the exact E.164 number and code into the two mock settings. Verify the entry before running: Appwrite treats unregistered numbers as real destinations.

**Delivery number.** Use an existing SMS-capable MailSlurp number you control. Keep it out of Appwrite's mock list. Put its MailSlurp ID in `MAILSLURP_PHONE_ID`; the SDK retrieves the E.164 number. Confirm that the Appwrite SMS sender supports this country's route and this type of number, and check your Appwrite and MailSlurp allowances or charges. Set `APPWRITE_SMS_MARKER` to a stable, project-specific phrase in the delivered message. The sample expects one six-digit code. Adjust the parser and its tests if your staging template differs.

Appwrite Cloud offers its mock phone number setting on Pro and higher. On Free, you can run the local phone fixtures or [test a delivered email code](../appwrite-email-otp/README.md).

## CI and cleanup

Run `npm test` on pull requests. Use the configured mock-number command for regular staging checks. Run real SMS deliberately, for example in a manually triggered job. Keep `MAILSLURP_API_KEY` and the fixed mock code in CI secrets. Make the number exclusive to one job at a time across all runners; Playwright's single worker only serializes tests within one process. In GitHub Actions, jobs sharing the number can use:

```yaml
concurrency:
  group: appwrite-staging-sms
  cancel-in-progress: false
```

Use a separate number per concurrent job if serialization isn't practical. Keep traces, videos, screenshots and verbose API logging off for staging runs. The runner leaves automatic retries off. A retry could send another SMS and an earlier delivery could arrive during it.

The test ends the session it created. Appwrite may create a staging user on first use of a phone. Reuse that test user for future runs, or remove it through the console when retiring the test. The sample never purchases or releases a phone number. If a run is interrupted after session creation, inspect the staging user's sessions and revoke the test session.

## Troubleshooting

| Where the run stops | What to verify |
| --- | --- |
| Port already in use | Stop the existing local process on 4173 before running the sample. |
| Phone token request | Check the endpoint, project ID, allowed hostname, Phone auth setting, E.164 format and API rate limits. Avoid a retry loop. |
| SMS wait | The wait is 60 seconds. Check that the number is absent from Appwrite's mock list, that the sender supports the route, and whether the staging SMS reached the MailSlurp dashboard. If it arrived, compare its non-secret wording with the configured marker and check the runner's clock. |
| Session or account verification | Check the mock code or template, OTP expiry and overlapping requests. If the exchange succeeds but the account read fails, check the browser's session/cookie configuration. Use redacted timestamps and response statuses for diagnosis. |

Source files: [browser form](src/app.ts), [staging test](test/staging.spec.ts), [MailSlurp wait and parser](test/sms.ts), [local tests](test/local.spec.ts).
