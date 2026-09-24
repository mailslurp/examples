# Playwright email OTP testing with AI and Playwright request

This copies the signup, email confirmation and sign-in flow from `../playwright-email-testing`,
using Playwright's built-in `request` fixture and direct endpoint URLs. AI extracts a typed code with source evidence;
Playwright enters it in the application and verifies that sign-in succeeds.

## Install

Requires Node.js 22+.

```sh
npm ci
npx playwright install chromium
npm run typecheck
```

## Run against an API and application

Use an API version that includes `/ai/messages/wait`:

```sh
MAILSLURP_API_KEY=your-key \
MAILSLURP_BASE_PATH=https://your-api-host \
APP_URL=https://playground.mailslurp.com \
npm test
```

`MAILSLURP_BASE_PATH` defaults to `https://api.mailslurp.com`. It controls every MailSlurp request,
including inbox creation and cleanup. `APP_URL` controls the signup application, which must use
the original playground selectors or equivalent selectors adapted in the test.
The browser receives no MailSlurp API key: API requests run through the Playwright request fixture, outside the page.

The test creates a fresh inbox, captures `since` before signup, waits for the signup email and
extracts a six-digit string. A leading zero remains intact. It asserts `successful`, settled usage
and source evidence before submitting the code. The regex checks the returned type/format; it does
not extract the code from email text. Model-reported confidence is not used as a correctness gate.
Retries are disabled. A failure retains a browser trace and screenshot for diagnosis.
Only the inbox created by this test is deleted at the end.

## The first AI request

The executable test uses this request directly; there is no client wrapper:

```ts
const response = await request.post(`${baseUrl}/ai/messages/wait`, {
  headers: { ...headers, 'Idempotency-Key': randomUUID() },
  timeout: 130_000,
  data: {
    scope: { inboxIds: [inbox.id] }, since, timeout: 120_000,
    match: { prompt: 'The account signup verification email containing a confirmation code' },
    extractionPreset: 'OTP_CODE',
  },
});
await expect(response).toBeOK();
const result = await response.json();
expect(result.successful, result.summary).toBe(true);
expect(result.data?.code).toMatch(/^\d{6}$/);
```

`OTP_CODE` returns `data.code` as a string, preserving leading zeros, letter case and separators.
It supports numeric and alphanumeric codes; the six-digit assertion above is specific to this
application. Missing or equally eligible codes produce `INCONCLUSIVE`, `data: null`, and an
`extractionReason` included in `summary`. Model explanations are diagnostic text, not verified
facts or stable values to match exactly in tests. Assert `successful` before entering the code.

Use the same preset with `/ai/messages/extract` and `message: { type: 'SMS', id: smsId }`,
or with `scope: { phoneNumberIds: [phoneId] }` on the wait endpoint. Each expectation in
`/ai/messages/wait-all` can also have its own preset.

## Advanced controls and response types

The first request uses the default model and token limits. If a test needs explicit controls,
add `aiOptions` to its request body:

```ts
aiOptions: {
  model: 'BALANCED_V1',
  maxTokens: 8000,
  maxCandidates: 4,
  maxOutputTokens: 2048,
}
```

`maxTokens` is a shared budget of weighted MailSlurp AI tokens for the entire request. Inspect
`GET /ai/models` for available models and multipliers. `minimumConfidence` is an optional advanced
abstention threshold; model-reported confidence is not a calibrated probability of correctness.
These controls do not cause retries until an evaluation passes.

For fields other than a code, replace `extractionPreset` with `outputSchema`, or use `transformId`
for a saved schema. These three selectors are mutually exclusive. Existing custom-schema callers
keep their original response shape.

The small TypeScript response projections live in `tests/response-types.ts`. The separate
`playwright_ai_diagnostics` section asserts settlement and `/code` source evidence and attaches
the evaluation ID and token usage to the Playwright report. The API's result includes additional
message, model and assertion metadata; these local types only declare what this example reads.

## Reproduce with local Spring Boot and real Gemini

With sibling `ms2-api` and `examples` checkouts, put `GEMINI_API_KEY` in `ms2-api/.env`, install the
Node dependencies above, then run from `ms2-api`:

```sh
ENABLE_AI_SMOKETEST=true ENABLE_AI_PLAYWRIGHT_SMOKETEST=true \
./gradlew --no-configuration-cache aiSmokeTest --tests '*LiveAIMessageSmokeIT.advanced Playwright*'
```

The Spring test starts the real API on a random local port and supplies an isolated test-user API
key. Playwright starts the local application in `fixture/server.mjs` on an OS-assigned free port
and captures its URL as `APP_URL`; existing local servers are left alone. That application generates a
fresh random OTP (with a leading zero), imports its MIME email via the public inbox import endpoint,
and checks the submitted code and password. A different six-digit support reference in the email
checks that extraction selects the right number. No canned AI responses or browser route mocks are
used. The local transport uses MIME import; this run does not test public SMTP delivery or the hosted
playground's account service. Stripe is mocked by the Spring context.

Reports: `playwright-report/index.html`, `test-results/results.json`, and
`ms2-api/build/reports/ai-smoke/playwright-process.log`. Traces contain synthetic fixture data.

## Guide snippets

`tests/email-otp.spec.ts` and `tests/response-types.ts` use the repository's exact `//<gen>name` and `//</gen>` markers:

- `playwright_ai_imports`
- `playwright_ai_response_types`
- `playwright_ai_create_inbox`
- `playwright_ai_signup`
- `playwright_ai_wait_extract`
- `playwright_ai_diagnostics`
- `playwright_ai_verify_signin`
- `playwright_ai_cleanup`

Keep these sections synchronized with the executable test when assembling a guide. The fixture
server is local validation infrastructure; it is not required when testing an application that
already sends verification emails to MailSlurp.
