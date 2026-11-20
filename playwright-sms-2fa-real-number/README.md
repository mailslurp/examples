# Test SMS two-factor login in Playwright with a real phone number

Playwright tests for SMS one-time codes, in two layers: fast tests of a small sign-in app with a simulated SMS sender, and one test that signs up to [MailSlurp's SMS playground](https://playground-sms.mailslurp.com) with a real phone number and enters the code it receives by text.

The local app asks for an email and password, sends a six-digit code, and signs the browser in when the code is entered. Its tests check the parts users care about: the right code signs them in, a wrong code doesn't, and a code can't be used twice. The playground test checks the part a simulator can't: that a real text arrives and its code works.

## Why test with a real number

Most SMS providers give you a way to test without sending anything, and those are the right tool for fast checks. They don't tell you whether a text reached a phone:

- **Twilio test credentials** validate your request and return a message, but Twilio [doesn't connect to real phone numbers or charge your account](https://www.twilio.com/docs/iam/test-credentials), and status callbacks never fire. A test that only checks the API response passes even if the live sender, number format or template would fail.
- **Firebase fictional phone numbers** accept a fixed code and send no SMS, and the [Authentication emulator](https://firebase.google.com/docs/emulator-suite/connect_auth) prints codes to its terminal instead of texting them. Both exercise your sign-in code, not delivery.
- **Mocking your SMS client** in the app proves you called it with the right arguments.

Before a release, you also want one test where the provider sends a real SMS, a real number receives it, and the test signs in with that code. That catches a wrong sender ID, an unsupported route, a template that drops the code, and codes that arrive after they expire.

This example does both. The local suite uses an in-memory sender, like an emulator, so it runs anywhere in about a second. The real-number test uses the SMS playground, a demo app run by MailSlurp whose sign-up texts a verification code through AWS. The test reads that text from a [MailSlurp phone number](https://www.mailslurp.com/docs/txt-sms/) with the API, so it needs no physical phone, shared device or SMS provider account of your own. To test your own app, point the same steps at your sign-up page and SMS provider.

## Run the local suite

Use Node.js 22.12 or later. From this folder:

```sh
npm ci
npx playwright install chromium
npm test
```

Expect four passing tests. They start the app with the in-memory sender, read the "sent" code from the app's simulated outbox and check sign-in, a wrong code and a replayed code. No credentials or network access are needed. On a Linux CI runner use `npx playwright install --with-deps chromium`.

## Run the real SMS test

You need a MailSlurp account with a US phone number ([create one](https://app.mailslurp.com/mobile/phone-numbers/) in the dashboard) and an API key. Copy `.env.example` to `.env`, set `MAILSLURP_API_KEY`, load it into your shell and run:

```sh
set -a; . ./.env; set +a
npm run test:sms
```

The test uses the first US number in the account, or the number in `MAILSLURP_PHONE_ID`. It signs up to the playground with that number, waits up to 60 seconds for a new text containing "demo-sms verification code", enters the six-digit code, signs in and checks the greeting. It adds the measured delivery time to the test report.

The playground's username is the phone number, so each number can only have one account. The test therefore deletes the playground user at the end, using the session it just signed in with, and the number can sign up again on the next run. If an earlier run stopped before that step, the test signs in with the same password first and deletes the leftover user. A number with an unconfirmed sign-up can't be cleaned up this way; use another number.

Each run sends one real SMS.

## How the test reads the code

```ts
const since = new Date();
await signUp(page, phone.phoneNumber);

const [sms] = await mailslurp.waitController.waitForSms({
  waitForSmsConditions: {
    phoneNumberId: phone.id,
    since,
    count: 1,
    timeout: 60_000,
    matches: [{ field: SmsMatchOptionFieldEnum.BODY, should: SmsMatchOptionShouldEnum.CONTAIN, value: "demo-sms verification code" }],
  },
});
await confirmAndSignIn(page, phone.phoneNumber, extractCode(sms.body));
await deleteSignedInUser(page);
```

`since` ignores codes from earlier runs, and matching the playground's wording ignores unrelated texts. `extractCode` fails unless the message holds exactly one six-digit code. The [wait-for methods](https://www.mailslurp.com/docs/wait-for/) wait on the server, so the test needs no sleep or retry loop.

## In CI

Run `npm test` on every pull request. This repository does that with [a GitHub Actions workflow](../.github/workflows/playwright-sms-2fa-real-number.yml) that needs no secrets.

Run `npm run test:sms` deliberately, for example nightly or before a release, with the API key in CI secrets. Give each concurrent job its own number, or serialize jobs that share one, as the `concurrency` group below does. A GitHub Actions job for the real-number test, started by hand or on a schedule:

```yaml
  real-sms:
    if: github.event_name == 'workflow_dispatch' || github.event_name == 'schedule'
    runs-on: ubuntu-latest
    concurrency:
      group: sms-2fa-real-number
      cancel-in-progress: false
    defaults:
      run:
        working-directory: playwright-sms-2fa-real-number
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:sms
        env:
          MAILSLURP_API_KEY: ${{ secrets.MAILSLURP_API_KEY }}
          MAILSLURP_PHONE_ID: ${{ vars.MAILSLURP_PHONE_ID }}
```

Retries are off because a retry sends another SMS, and the earlier one can arrive during it.

## Troubleshooting

| Where it stops | What to check |
| --- | --- |
| "This test needs a US phone number" | The API key's account has no US number. Add one, or set `MAILSLURP_PHONE_ID`. |
| "has an unconfirmed playground account" | An earlier run signed up but never confirmed. Use another number. |
| No code within 60 seconds | Open the number's messages in the MailSlurp dashboard. If nothing arrived, retry later or with another number. |
| "Not a playground code" | Another message matched. Use a number dedicated to this test. |

## Files

- [app/server.mjs](app/server.mjs): the local sign-in app, with code expiry, attempt limits and single use.
- [app/sms.mjs](app/sms.mjs): the in-memory sender.
- [tests/local.spec.ts](tests/local.spec.ts): the simulated suite.
- [tests/playground-sms.spec.ts](tests/playground-sms.spec.ts): the real-number test.
- [tests/playground.ts](tests/playground.ts): playground steps, the code parser and user cleanup.
- [tests/flow.ts](tests/flow.ts): local app steps and its code parser.

For a longer walkthrough, see [Test SMS OTP and MFA with Playwright](https://www.mailslurp.com/guides/test-sms-otp-mfa-using-playwright/).
