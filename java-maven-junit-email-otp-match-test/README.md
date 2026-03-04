# Java Maven JUnit Email OTP Match Test

This project is a Java + Maven + JUnit test that validates an email OTP signup flow end to end using MailSlurp (MailSoup).

It demonstrates a common system-test pattern:

1. Create an isolated inbox.
2. Trigger signup in the system under test.
3. Wait for a matching email by subject.
4. Extract the OTP code from email content.
5. Submit the code to confirm signup.
6. Login and verify success.

The implementation is designed for broad runtime compatibility:

- Java source/target: `1.8` (runs on Java 8+)
- Works on modern JVMs (for example Java 17/21/25) when Maven and network access are available.

## Canonical Test

Primary test file:

- `src/test/java/com/mailslurp/examples/EmailOtpMatchFlowTest.java`

The test uses:

- MailSlurp Java client `17.1.0` for inbox creation/cleanup.
- Direct HTTP calls for the signup/confirm/login sample endpoints and matching/extraction endpoints.

The README flow is intentionally kept in sync with this canonical test implementation.

## Endpoints Used

MailSlurp API endpoints:

- `POST /inboxes`
- `POST /waitForMatchingEmails`
- `POST /emails/{emailId}/contentMatch`

Sample application endpoints under test:

- `POST /test-endpoints/sign-up`
- `POST /test-endpoints/confirm`
- `POST /test-endpoints/login`

## Method References

MailSlurp API docs:

- `createInbox`: `https://docs.mailslurp.com/api/#operation/createInbox`
- `waitForMatchingEmails`: `https://docs.mailslurp.com/api/#operation/waitForMatchingEmails`
- `getEmailContentMatch`: `https://docs.mailslurp.com/api/#operation/getEmailContentMatch`

Sample endpoint behavior and expected responses:

- `../http-accelq-email-otp-test/test-application.md`

## Environment Variables

`Makefile` includes `../.env` and supports these variables:

- `MAILSLURP_API_KEY` (or fallback `API_KEY`)
- `MAILSLURP_BASE_URL` (default: `https://api.mailslurp.com`)
- `TEST_ENDPOINTS_BASE_URL` (default: same as `MAILSLURP_BASE_URL`)
- `TEST_PASSWORD` (default: `TestPass123!`)
- `WAIT_TIMEOUT_MS` (default: `120000`)
- `SUBJECT_MATCH` (default: `Please confirm your email address`)

## Run

### Using Make (recommended)

```bash
make test
```

### Using Maven directly

```bash
MAILSLURP_API_KEY=your_api_key_here mvn -q -Dtest=EmailOtpMatchFlowTest test
```

## How Waiting and Matching Works

The test uses `POST /waitForMatchingEmails` with:

- `inboxId`: the created inbox UUID
- `count=1`
- `timeout=120000` (configurable)
- `unreadOnly=true`
- match condition:
  - `field=SUBJECT`
  - `should=CONTAIN`
  - `value=Please confirm your email address`

This pattern avoids arbitrary sleep/retry loops and waits for the specific expected message.

## How Code Extraction Works

The test calls `POST /emails/{emailId}/contentMatch` with regex:

- `Your confirmation code is "(\w+)"\.`

Then it reads capture group 1 from `matches[1]`, and posts that value to:

- `POST /test-endpoints/confirm`

After confirmation it validates login via:

- `POST /test-endpoints/login` expecting `Login successful`.
