# MailSlurp JavaScript client 17.6.0 validation

Validated on 2026-09-24 in the isolated `codex/update-mailslurp-client-17-6`
worktree, then integrated into the main examples checkout. Existing changes
in the main examples checkout were preserved.
No package was published.

## Changes

- Pinned all 23 npm manifests that directly depend on `mailslurp-client` to
  `17.6.0`; refreshed the 21 existing npm lockfiles and the Bun lockfile.
  The n8n example did not have a lockfile.
- Switched examples to the portable named `MailSlurp` export. Native Node ESM
  exposes the CommonJS package's default export as an object, so constructing
  the screenshot example's dynamically imported default fails.
- Fixed the device-render example's missing-key guard: client construction no
  longer throws before the intended test skip.
- Fixed React Email's SMTP TLS configuration, including secure ports other than
  465, and its empty verification-code fixture. The live test passes.
- Fixed the Playwright magic-link flow to keep signup, confirmation, and the
  dashboard check in one test with the same inbox and page.
- Fixed Puppeteer's short confirmation-page wait and test timeout.
- Fixed SendGrid's hard-coded inbox domain assertion, awaited the send operation,
  and made the verified sender configurable. Live tests explicitly skip without
  `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`.
- Added `npm run test:client`, a credential-free version, CommonJS/native ESM,
  controller, and custom-fetch smoke check for all 24 direct-consumer manifests after incorporating the existing Cypress SMS
  upgrade. That example retains its existing `^17.6.0` range. Node's normal
  parent dependency resolution also covers examples without a local install;
  this check does not substitute for each example's integration suite.

## Results

The registry's published `mailslurp-client@17.6.0` was used. Live tests used the
existing examples API key without copying it into the worktree. Most tests ran
on Node 26.5.0. Browser runs used one worker/headless mode where supported.

| Example/check | Result |
| --- | --- |
| Root SDK compatibility check | Passed for 24 manifests after incorporating the existing Cypress SMS upgrade |
| npm installations | Passed for root and all 20 examples with npm lockfiles |
| Bun installation | Passed |
| `JavaScript-InboxPlacement-Test` | API-surface check passed; two opt-in live workflows skipped |
| `wait-for-methods-vitest` | Live email test passed |
| `javascript-react-email` | Live email/SMTP test passed after fixes |
| `nodejs-nodemailer-smtp-example` | Three live SMTP tests passed |
| `nodejs-smtp-email-attachments-test` | Live attachment test passed |
| `bun-js-send-email` | Live SMTP/email test passed |
| `javascript-cypress-js` | Live browser test passed |
| `javascript-cypress-js-open-email` | Live browser test passed |
| `javascript-cypress-newsletter-signup` | Live browser test passed |
| `playwright-email-testing` | All three live browser tests passed after fixing the magic-link flow |
| `javascript-jest-puppeteer` | All seven live browser tests passed using installed Chrome |
| `javascript-email-screenshot` | Client import fixed; live screenshot endpoint returns HTTP 500 |
| `javascript-device-render` | Missing-key skip verified; live API calls work, but the native render finishes `FAILED` |
| `playwright-sms-testing` | Test discovery passed; no US phone number is allocated to the test account, so live SMS was not run |
| `sendgrid` | Discovery passed; live test skips without SendGrid credentials and a verified sender |
| `firebase-examples` | Production build passed; full Firebase/Nightwatch flow not run |
| `totp-mfa-auth0-selenium` | Production build passed with the existing local Auth0 config; full MFA flow not run |
| `next-auth-example` | Type checking passed; full local-app login flow not run |
| `javascript-testcafe` | Browser launch blocked by macOS Screen Recording permission |
| `javascript-codecept-js` | Three live scenarios passed using installed Chrome |
| `javascript-webdriver-io` | Skipped at user request; Firefox/WebDriver check was stopped without a passing result |
| `n8n-email-otp-test` | Standalone live OTP workflow passed on Node 20.20.2 with Puppeteer 21.11.0 and installed Chrome; full n8n platform dependency resolution exceeded 100 seconds |

The screenshot service and native-device render failures require service-side
investigation. They were not hidden by changing assertions or treating failures
as skips. The existing Cypress plugin/SMS work in the main checkout already
uses the newer client/plugin and was not overwritten. Other-language SDKs were
outside this JavaScript SDK upgrade.

## Reproducing checks

Use Node 18 or newer for the SDK smoke check. Run `npm ci` and
`npm run test:client` at the repository root. Install each
example's own dependencies before its integration suite. Export `API_KEY` for
live MailSlurp tests and configure any additional providers documented by that
example. Cypress 14.5.4 requires its browser binary (`npx cypress install`).

Some older test runners need version-specific options: Vitest 0.34 accepts
`--threads=false`; Vitest 1.1 does not. The wait-for suite was run with
`VITEST_MAX_THREADS=1 VITEST_MIN_THREADS=1 npm test`. The React Email suite used
`npm test -- --threads=false --testTimeout=60000`.

The n8n standalone runner was checked using Node 20.20.2 and Puppeteer 21.11.0
installed separately from the full n8n platform. Its old Puppeteer dependency
chain fails to load under Node 26, so use the supported older Node runtime for
that example. System Chrome was supplied through `PUPPETEER_EXECUTABLE_PATH`.
