# Test SMS two-factor login in Playwright with a real phone number

A small sign-in app with SMS two-factor authentication, and Playwright tests that sign in twice: once with a simulated SMS and once with a code delivered to a real phone number.

The app asks for an email and password, sends a six-digit code by SMS, and signs the browser in when the code is entered. The tests check the parts users care about: the code arrives, the right code signs them in, a wrong code doesn't, and a code can't be used twice.

## Why test with a real number

Most SMS providers give you a way to test without sending anything, and those are the right tool for fast checks. They don't tell you whether a text reached a phone:

- **Twilio test credentials** validate your request and return a message, but Twilio [doesn't connect to real phone numbers or charge your account](https://www.twilio.com/docs/iam/test-credentials), and status callbacks never fire. A test that only checks the API response passes even if the live sender, number format or template would fail.
- **Firebase fictional phone numbers** accept a fixed code and send no SMS, and the [Authentication emulator](https://firebase.google.com/docs/emulator-suite/connect_auth) prints codes to its terminal instead of texting them. Both exercise your sign-in code, not delivery.
- **Mocking your SMS client** in the app proves you called it with the right arguments.

Before a release, you also want one test where the provider sends a real SMS, a real number receives it, and the test signs in with that code. That catches a wrong sender ID, an unsupported route, a template that drops the code, and codes that arrive after they expire.

This example does both. The local suite uses an in-memory sender, like an emulator, so it runs anywhere in about a second. The real-number test sends through your SMS provider and reads the text from a [MailSlurp phone number](https://www.mailslurp.com/docs/txt-sms/) with the API, so it needs no physical phone or shared device.

## Run the local suite

Use Node.js 22.12 or later. From this folder:

```sh
npm ci
npx playwright install chromium
npm test
```

Expect four passing tests. They start the app with the in-memory sender, read the "sent" code from the app's simulated outbox and check sign-in, a wrong code and a replayed code. No credentials or network access are needed. On a Linux CI runner use `npx playwright install --with-deps chromium`.

## Run the real SMS test

You need:

- a MailSlurp account with an SMS-capable phone number to receive the code ([create one](https://app.mailslurp.com/mobile/phone-numbers/) in the dashboard or with the API), its ID and an API key;
- a way for the app to send: live Twilio credentials and an SMS-capable Twilio number, or a second MailSlurp number that is allowed to send to the receiving number (see below).

Copy `.env.example` to `.env`, fill in the settings for your sender, load them into your shell and run:

```sh
set -a; . ./.env; set +a
npm run test:sms
```

| Setting | Used by | Purpose |
| --- | --- | --- |
| `MAILSLURP_API_KEY`, `MAILSLURP_PHONE_ID` | Test | The number that receives the code. The config looks up its E.164 number and gives it to the demo account. |
| `SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | App | Send with Twilio's Messaging API. Use live credentials; test credentials send nothing, so the test times out. |
| `SMS_PROVIDER=mailslurp`, `MAILSLURP_SENDER_PHONE_ID` | App | Send from a second MailSlurp number with the same API key. |

By default, a MailSlurp number can only send to numbers that have texted it first, and both numbers here belong to you, so neither has. To send the code from a MailSlurp number, ask MailSlurp support to allow sending to your receiving test number. Twilio, or the SMS provider your application already uses, needs no such step and also tests your real sending route.

The test records the time before it asks for a code, waits up to 60 seconds for a new message on the MailSlurp number that contains "Demo App sign-in code", extracts the six-digit code, enters it and checks the account page. It adds the measured delivery time to the test report.

Each run sends one SMS, which your provider may charge for. In the US, sending application traffic from a Twilio long code requires A2P 10DLC registration; if your messages are filtered, check your provider's registration status before blaming the test.

## How the test reads the code

```ts
const since = new Date();
await submitPassword(page);

const [sms] = await mailslurp.waitController.waitForSms({
  waitForSmsConditions: {
    phoneNumberId,
    since,
    count: 1,
    timeout: 60_000,
    matches: [{ field: SmsMatchOptionFieldEnum.BODY, should: SmsMatchOptionShouldEnum.CONTAIN, value: codeMarker }],
  },
});
await submitCode(page, extractCode(sms.body));
await expectSignedIn(page);
```

`since` ignores codes from earlier runs, and matching the app's wording ignores unrelated texts. `extractCode` fails unless the message holds exactly one six-digit code. The [wait-for methods](https://www.mailslurp.com/docs/wait-for/) poll on the server, so the test needs no sleep or retry loop.

## In CI

Run `npm test` on every pull request. This repository does that with [a GitHub Actions workflow](../.github/workflows/playwright-sms-2fa-real-number.yml) that needs no secrets.

Run `npm run test:sms` deliberately, for example nightly or before a release, with the credentials in CI secrets. Give each concurrent job its own receiving number, or serialize jobs that share one. A GitHub Actions job for the real-number test, started by hand or on a schedule:

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
          SMS_PROVIDER: twilio
          TWILIO_ACCOUNT_SID: ${{ secrets.TWILIO_ACCOUNT_SID }}
          TWILIO_AUTH_TOKEN: ${{ secrets.TWILIO_AUTH_TOKEN }}
          TWILIO_FROM: ${{ vars.TWILIO_FROM }}
```

Retries are off because a retry sends another SMS, and the earlier one can arrive during it.

## Troubleshooting

| Where it stops | What to check |
| --- | --- |
| `Set MAILSLURP_API_KEY and MAILSLURP_PHONE_ID` | The settings aren't loaded into the shell that runs Playwright. |
| "The code could not be sent" page | The app's server log names the provider error: credentials, sender number, or a route the provider doesn't support. |
| No code within 60 seconds | Check the message in your provider's logs, then the number's inbox in the MailSlurp dashboard. Test credentials, an unregistered US sender or an unsupported country route are the usual causes. |
| "Not a Demo App sign-in code" | Another message matched. Use a number dedicated to this test. |

## Files

- [app/server.mjs](app/server.mjs): the sign-in app, with code expiry, attempt limits and single use.
- [app/sms.mjs](app/sms.mjs): the in-memory, Twilio and MailSlurp senders.
- [tests/local.spec.ts](tests/local.spec.ts): the simulated suite.
- [tests/real-sms.spec.ts](tests/real-sms.spec.ts): the real-number test.
- [tests/flow.ts](tests/flow.ts): shared steps and the code parser.

For a longer walkthrough, see [Test SMS OTP and MFA with Playwright](https://www.mailslurp.com/guides/test-sms-otp-mfa-using-playwright/).
