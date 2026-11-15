# Test Appwrite phone sign-in with a real SMS in Playwright

A phone login has two chances to disappoint a user. The verification text can fail to arrive, or the app can accept the code on screen without leaving the browser signed in. A useful end-to-end test finishes by reading the account from the same browser that submitted the code.

We'll test a small TypeScript page with two forms. The first asks for a phone number. After Appwrite accepts the request, the second asks for the code. We'll first use Appwrite's fixed-code option to check the session flow. Then we'll repeat the same interaction with an SMS delivered to a dedicated MailSlurp number.

## Start with the browser session

Open the sample directory and run `npm ci`, `npx playwright install chromium`, and `npm test`. The default suite runs locally. It uses the Appwrite web SDK in Chromium and local HTTP responses, so you can inspect the example before connecting a staging project. The [README](README.md) lists the staging settings and commands.

When the user presses **Send code**, the page requests a phone token. Save the user ID Appwrite returns. If this number already belongs to a user, Appwrite uses that account; the generated ID you offered when requesting the token is no longer the right value to pass into the next step.

```ts
const token = await account.createPhoneToken({
  userId: ID.unique(),
  phone: phone.value,
});
userId = token.userId;
```

When the user submits the code, use that returned ID to create a session. Read the profile immediately afterwards with the same SDK client. The session and account should both identify the user who received the token, and the account's phone should match the number you entered.

```ts
const session = await account.createSession({ userId, secret: code.value });
const user = await account.get();
if (session.userId !== userId || user.$id !== userId || user.phone !== phone.value) {
  throw new Error('Account mismatch');
}
```

That final read catches a failure that a success screen alone can hide. The local suite includes a case where the exchange succeeds and the profile belongs to a different account. The page reports a verification failure and the test ends the session.

## Use a fixed code for regular staging checks

Appwrite Cloud offers its mock phone number setting on Pro and higher. On Free, you can run the local phone fixtures or [test a delivered email code](../appwrite-email-otp/README.md).

In your staging Appwrite project, enable Phone authentication, register `localhost` as a Web platform, and configure a mock phone number with a fixed code under Auth → Settings → Mock phone numbers. Put those values and the project connection details in the sample's `.env`, then run:

```sh
npm run test:mock
```

Appwrite handles the challenge and session for that configured number using the fixed code. This gives you a repeatable check when changing form handling, session persistence or account selection. The carrier route is exercised in the next run. [Appwrite phone login](https://appwrite.io/docs/products/auth/phone-sms) · [Mock phone number settings](https://appwrite.io/docs/advanced/security/authentication)

## Receive a fresh verification text

For a delivery check, use a dedicated MailSlurp number in a region your Appwrite sender supports. Leave this number out of the mock-number list. Keep the MailSlurp API key on the Playwright runner. The web page only needs the public Appwrite endpoint and project ID.

Set `MAILSLURP_PHONE_ID` to the ID of that number. Set `APPWRITE_SMS_MARKER` to distinctive wording present in your project's verification message. For example, a staging template might say "Acme Staging" followed by a single six-digit code. The runner looks up the number, captures the time immediately before clicking **Send code**, and passes that time into the wait:

```ts
const messages = await client.waitController.waitForSms({
  waitForSmsConditions: {
    phoneNumberId: phoneId,
    since,
    timeout: 60_000,
    count: 1,
    matches: [{
      field: SmsMatchOptionFieldEnum.BODY,
      should: SmsMatchOptionShouldEnum.CONTAIN,
      value: marker,
    }],
  },
});
```

An unread message from yesterday could still be in this inbox. The time filter excludes it. The number and body filters narrow the result to the intended receiver and message template. The parser also checks those fields before it accepts a single six-digit code. Give each parallel run its own number, or serialize the runs. Otherwise two valid messages from the same sender can both satisfy the filters. [MailSlurp JavaScript SDK](https://docs.mailslurp.com/js/) · [Wait for SMS](https://www.mailslurp.com/docs/wait-for/)

With the sender, number and billing route checked, run:

```sh
npm run test:sms
```

Playwright enters the newly received code in the browser. A passing test means the browser obtained the expected account after the exchange and then ended the session. If the wait times out, check whether any message reached the staging number before changing the sign-in code. A message visible in the inbox points you toward its timestamp, template wording or code format. An empty inbox points you toward the sender, destination or mock-number configuration.

Keep the fixed-code test in the regular staging suite. Use the carrier check when changing the SMS provider, destination route or verification template. Keep the number reserved for that job and leave automatic retries off so a delayed text from an earlier attempt cannot satisfy the next one.
