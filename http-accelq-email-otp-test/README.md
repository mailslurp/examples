# HTTP ACCELQ Email OTP Test

This project demonstrates an HTTP-only email OTP signup test using MailSlurp APIs plus MailSlurp's test application endpoints.

Canonical test definition:

- `hurl/signup-email-otp-flow.hurl`

The README and the Hurl file are intentionally aligned. If you change the flow, keep both in sync.

## ACCELQ OpenAPI Import

You can import MailSlurp OpenAPI directly into ACCELQ:

- OpenAPI JSON: `https://api.mailslurp.com/v2/api-docs`
- Alternate OpenAPI URL: `https://api.mailslurp.com/v2/api-docs?format=openapi`

## What This Test Covers

This flow tests signup confirmation end to end:

1. Create a real inbox email address.
2. Submit signup to the test application.
3. Wait for a matching email subject.
4. Extract OTP/confirmation code with `contentMatch`.
5. Confirm signup with the extracted code.
6. Login and verify success.

Test application flow reference:

- `./test-application.md`

Exact canonical sequence (method + path):

1. `POST /inboxes`
2. `POST /test-endpoints/sign-up`
3. `POST /waitForMatchingEmails`
4. `POST /emails/{emailId}/contentMatch`
5. `POST /test-endpoints/confirm`
6. `POST /test-endpoints/login`

## Test Application vs Your Application

This repository uses MailSlurp's test endpoints (`/test-endpoints/*`) as a deterministic sample system under test.

You can swap those two application calls to your own service:

- Signup endpoint (equivalent of `/test-endpoints/sign-up`)
- Confirmation endpoint (equivalent of `/test-endpoints/confirm`)
- Optional login verification endpoint (equivalent of `/test-endpoints/login`)

Keep inbox creation, wait-for-matching, and extraction calls on MailSlurp.
The passing test currently expects:

- Subject contains: `Please confirm your email address`
- Extraction regex: `Your confirmation code is "(\w+)"\.`

## Methods Used And References

MailSlurp API methods:

- `POST /inboxes` (`createInbox`)  
  `https://docs.mailslurp.com/api/#createInbox`
- `POST /waitForMatchingEmails` (`waitForMatchingEmails`)  
  `https://docs.mailslurp.com/api/#waitForMatchingEmails`
- `POST /emails/{emailId}/contentMatch` (`getEmailContentMatch`)  
  `https://docs.mailslurp.com/api/#getEmailContentMatch`

Test application methods used by this flow:

- `POST /test-endpoints/sign-up`
- `POST /test-endpoints/confirm`
- `POST /test-endpoints/login`
- Endpoint behavior and expected responses: `./test-application.md`

## Prerequisites

- `hurl` installed locally.
- MailSlurp API key in `../.env`.

The `Makefile` uses `include ../.env`, and supports both:

- `MAILSLURP_API_KEY=...`
- `API_KEY=...` (fallback)

## Configuration

`Makefile` defaults:

- `MAILSLURP_BASE_URL=https://api.mailslurp.com`
- `TEST_ENDPOINTS_BASE_URL=$(MAILSLURP_BASE_URL)`
- `TEST_PASSWORD=TestPass123!`
- `WAIT_TIMEOUT_MS=120000`

Override at runtime:

```bash
make test TEST_ENDPOINTS_BASE_URL=https://api.mailslurp.com TEST_PASSWORD='MyStrongPassword123!'
```

## Run The Canonical Test

```bash
make test
```

This executes:

- `hurl/signup-email-otp-flow.hurl`

## HTTP Step Snippets (Mirror of Canonical Flow)

### 1) Create inbox

Creates a MailSlurp inbox and captures `id` and `emailAddress`.

```bash
curl -sS -X POST "https://api.mailslurp.com/inboxes" \
  -H "x-api-key: $MAILSLURP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"expiresIn":300000}'
```

### 2) Submit signup

Starts signup in the test app using form fields (`@ModelAttribute` flow).

```bash
curl -sS -X POST "https://api.mailslurp.com/test-endpoints/sign-up" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "emailAddress=$EMAIL_ADDRESS" \
  --data-urlencode "password=$TEST_PASSWORD"
```

Expected response contains:

- `Confirmation code sent to`
- `/confirm?code=`

### 3) Wait for matching email subject

Waits for exactly one email to arrive in the inbox where subject contains:

- `Please confirm your email address`

```bash
curl -sS -X POST "https://api.mailslurp.com/waitForMatchingEmails?inboxId=$INBOX_ID&count=1&timeout=120000&unreadOnly=true" \
  -H "x-api-key: $MAILSLURP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "matches": [
      {
        "field": "SUBJECT",
        "should": "CONTAIN",
        "value": "Please confirm your email address"
      }
    ]
  }'
```

### 4) Extract confirmation code

Uses content extraction endpoint with regex from `test-application.md`:

- `Your confirmation code is "(\w+)"\.`

```bash
curl -sS -X POST "https://api.mailslurp.com/emails/$EMAIL_ID/contentMatch" \
  -H "x-api-key: $MAILSLURP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"pattern":"Your confirmation code is \"(\\w+)\"\\."}'
```

Note: group 1 is captured as `matches[1]` in the response.

### 5) Confirm signup with extracted code

```bash
curl -sS -X POST "https://api.mailslurp.com/test-endpoints/confirm" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "emailAddress=$EMAIL_ADDRESS" \
  --data-urlencode "code=$CONFIRMATION_CODE"
```

Expected response contains:

- `User confirmed`

### 6) Login and verify success

```bash
curl -sS -X POST "https://api.mailslurp.com/test-endpoints/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "emailAddress=$EMAIL_ADDRESS" \
  --data-urlencode "password=$TEST_PASSWORD"
```

Expected response contains:

- `Login successful`
