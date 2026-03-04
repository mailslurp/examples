# Test Application Signup Endpoints (`/test-application`)

## Scope
This document covers the signup-related test endpoints implemented by:

- `src/main/kotlin/com/mailslurp/http/controllers/user/ApiTestApplicationController.kt`
- `src/main/kotlin/com/mailslurp/http/controllers/user/ApiTestEndpointsController.kt`
- `src/main/kotlin/com/mailslurp/lib/services/testendpoints/TestEndpointsService.kt`

All of these endpoints are only active when `features.test_endpoints=true`.

## Prerequisites and invariants

- No API key auth is required on these test routes.
- Email signup/login only works for MailSlurp-backed addresses with a resolvable inbox.
- Phone signup/login only works for MailSlurp phone numbers.
- Passwords are stored as digests (`passwordDigest`) in `testendpoints_signups`.
- Confirmation is required before login.
- Signup and magic-link state is persisted in:
  - `testendpoints_signups`
  - `testendpoints_magiclink`

## Content type and parameter binding

All POST handlers here use `@ModelAttribute`, not `@RequestBody`.

- Primary usage: HTML form submits (`application/x-www-form-urlencoded`).
- Also supported by Spring binding: query string params with matching names.
- JSON request bodies are not what these handlers are designed for.

## Browser flow endpoints (`/test-application`)

### 1) Signup pages

#### `GET /test-application/sign-up`

- Purpose: render email signup form page.
- Query params:
  - `email` (optional): passed to model as `email`.
- Response: HTML page (`test-application/sign-up`).

#### `POST /test-application/sign-up`

- Purpose: start email signup.
- Form/body params:
  - `emailAddress` (required)
  - `password` (required)
- Internal behavior:
  - Creates signup row with `confirmed=false` and random confirmation code.
  - Sends confirmation code email to `emailAddress`.
- Success behavior:
  - Flash: `Confirmation code sent to <emailAddress>`
  - Redirect: `/test-application/confirm` (with model `email`)
- Error behavior:
  - Flash: `Error: <message>`
  - Redirect: `/test-application/sign-up`

#### `GET /test-application/sign-up-phone`

- Purpose: render phone signup form page.
- Query params:
  - `phone` (optional)
- Response: HTML page (`test-application/sign-up-phone`).

#### `POST /test-application/sign-up-phone`

- Purpose: start phone signup.
- Form/body params:
  - `phone` (required)
  - `password` (required)
- Internal behavior:
  - Validates phone is a MailSlurp number.
  - Creates signup row with `confirmed=false` and random confirmation code.
  - Sends SMS confirmation code.
- Success behavior:
  - Flash: `Confirmation code sent to <phone>`
  - Redirect: `/test-application/confirm-phone` (with model `phone`)
- Error behavior:
  - Flash: `Error: <message>`
  - Redirect: `/test-application/sign-up-phone`

### 2) Confirmation pages

#### `GET /test-application/confirm`

- Purpose: render email confirmation form.
- Query params:
  - `email` (optional)
- Response: HTML page (`test-application/confirm`).

#### `POST /test-application/confirm`

- Purpose: confirm email signup.
- Form/body params:
  - `emailAddress` (required)
  - `code` (required)
- Internal behavior:
  - Finds signup by `(emailAddress, code)` and sets `confirmed=true`.
- Success behavior:
  - Flash: `User confirmed. Please login`
  - Redirect: `/test-application/login`
- Error behavior:
  - Returns confirm page with flash `Error: <message>`.

#### `GET /test-application/confirm-phone`

- Purpose: render phone confirmation form.
- Query params:
  - `phone` (optional)
- Response: HTML page (`test-application/confirm-phone`).

#### `POST /test-application/confirm-phone`

- Purpose: confirm phone signup.
- Form/body params:
  - `phone` (required)
  - `code` (required)
- Internal behavior:
  - Finds signup by `(phone, code)` and sets `confirmed=true`.
- Success behavior:
  - Flash: `User confirmed. Please login`
  - Redirect: `/test-application/login-phone` (with model `phone`)
- Error behavior:
  - Flash: `Error: <message>`
  - Redirect target in code is `redirect:test-application/confirm-phone` (note missing leading `/`).

### 3) Login and session endpoints (part of signup flow completion)

#### `GET /test-application/login`

- Purpose: render email login form.
- Query params:
  - `email` (optional)

#### `POST /test-application/login`

- Form/body params:
  - `emailAddress` (required)
  - `password` (required)
- Internal behavior:
  - Verifies digest match and `confirmed=true`.
  - Sets cookie `testSessionCookie` for 1 hour.
- Success: redirect `/test-application/` with flash `Login successful`.
- Error: redirect `/test-application/login` with flash error.

#### `GET /test-application/login-phone`

- Purpose: render phone login form.
- Query params:
  - In controller, request param name is `email` (not `phone`) and value is mapped to the `phone` model attribute.

#### `POST /test-application/login-phone`

- Form/body params:
  - `phone` (required)
  - `password` (required)
- Internal behavior:
  - Verifies digest match and `confirmed=true`.
  - Sets cookie `testSessionCookie` for 1 hour.
- Success: redirect `/test-application/` with flash `Login successful`.
- Error: redirect `/test-application/login` with flash error.

#### `GET /test-application/`

- Purpose: home/dashboard gate.
- Behavior:
  - If no `testSessionCookie`: show home page with links to signup/login.
  - If cookie exists: decode `{identifier,password,isPhone}` and attempt login.
  - On successful re-auth: show dashboard.
  - On decode/login failure: redirect to `/test-application/login` with flash error.

#### `GET /test-application/logout`

- Purpose: clear test session.
- Behavior:
  - Deletes `testSessionCookie`.
  - Redirects to `/test-application/login`.

### 4) Magic link endpoints (alternative path)

#### `GET /test-application/magic-link`

- Purpose: render magic link request form.

#### `POST /test-application/magic-link`

- Form/body params:
  - `emailAddress` (required)
- Behavior:
  - Generates and stores magic-link code.
  - Sends templated email containing URL:
    - `https://<apiDomain>/test-application/magic-link-validate?code=<code>`
- Success: returns `test-application/magic-link-sent` page.
- Error: redirects back to `/test-application/magic-link` with flash error.

#### `GET /test-application/magic-link-validate`

- Query params:
  - `code` (required)
- Behavior:
  - Validates code.
  - Creates a new confirmed signup record with generated password.
  - Sets `testSessionCookie` from returned credentials.
- Success: redirect `/test-application/`.
- Error: redirect `/test-application/magic-link` with flash error.

## API-style companion endpoints (`/test-endpoints`)

These call the same service methods without HTML pages/redirects.

### `GET /test-endpoints/health`
- Response: `OK`

### `POST /test-endpoints/sign-up`
- Params: `emailAddress`, `password`
- Action: same as `/test-application/sign-up` POST.
- Response: text instructing to confirm with code.

### `POST /test-endpoints/confirm`
- Params: `emailAddress`, `code`
- Action: sets confirmed flag.
- Response: `User confirmed`

### `POST /test-endpoints/login`
- Params: `emailAddress`, `password`
- Action: checks credentials + confirmed flag.
- Response: `Login successful`

### `POST /test-endpoints/phone/sign-up`
- Params: `phone`, `password`
- Action: same as `/test-application/sign-up-phone` POST.
- Response: text instructing to confirm with code.

### `POST /test-endpoints/phone/confirm`
- Params: `phone`, `code`
- Action: sets confirmed flag.
- Response: `User confirmed`

### `POST /test-endpoints/phone/login`
- Params: `phone`, `password`
- Action: checks credentials + confirmed flag.
- Response: `Login successful`

## Email/SMS message patterns for testers

### Email OTP message (signup)

Used by:

- `POST /test-application/sign-up`
- `POST /test-endpoints/sign-up`

Email subject (exact):

- `Please confirm your email address`

Email body pattern (exact template):

```text
Your confirmation code is "<CODE>".

Please POST this code to the /confirm endpoint using ?code query param.
```

Regex to extract OTP (same pattern used by integration test):

```regex
Your confirmation code is "(\w+)"\.
```

Kotlin extraction example:

```kotlin
val regex = """Your confirmation code is "(\w+)"\.""".toRegex()
val code = regex.find(body)?.groups?.get(1)?.value
```

JavaScript extraction example:

```js
const match = body.match(/Your confirmation code is "(\w+)"\./);
const code = match?.[1];
```

### SMS OTP message (phone signup)

Used by:

- `POST /test-application/sign-up-phone`
- `POST /test-endpoints/phone/sign-up`

SMS body pattern:

```text
Your confirmation code is "<CODE>".
```

Regex to extract OTP:

```regex
Your confirmation code is "(\w+)"\.
```

### Magic-link email (not OTP)

Used by:

- `POST /test-application/magic-link`

Email subject:

- `Please confirm your email address`

Behavior:

- Sends HTML containing a link to:
  - `https://<apiDomain>/test-application/magic-link-validate?code=<CODE>`

If needed, extract the code from the URL with:

```regex
code=([A-Za-z0-9_-]+)
```

## End-to-end flow

### Email signup flow

1. User visits `GET /test-application/sign-up`.
2. User submits `POST /test-application/sign-up` with `emailAddress` + `password`.
3. Service saves pending signup and sends confirmation code email.
4. User submits `POST /test-application/confirm` with `emailAddress` + `code`.
5. Service marks signup confirmed.
6. User logs in via `POST /test-application/login`.
7. App writes `testSessionCookie` and dashboard is available at `/test-application/`.

### Phone signup flow

1. User visits `GET /test-application/sign-up-phone`.
2. User submits `POST /test-application/sign-up-phone` with `phone` + `password`.
3. Service validates MailSlurp phone and sends SMS code.
4. User submits `POST /test-application/confirm-phone` with `phone` + `code`.
5. Service marks signup confirmed.
6. User logs in via `POST /test-application/login-phone`.
7. App writes `testSessionCookie` and dashboard is available at `/test-application/`.

## Error semantics from service layer

- `400 Bad Request`:
  - Non-MailSlurp email/phone usage.
  - Missing inbox or phone resources.
- `401 Unauthorized`:
  - Confirmation code mismatch.
  - Invalid login credentials.
  - Login attempted before confirmation.

In browser endpoints these are generally caught and shown via flash + redirects; in `/test-endpoints/*` they surface as HTTP errors.
