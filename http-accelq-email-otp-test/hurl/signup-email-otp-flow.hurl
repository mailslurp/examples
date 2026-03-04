# Canonical flow for this project:
# 1) Create inbox
# 2) Submit signup (test application)
# 3) Wait for matching email subject
# 4) Extract code via contentMatch
# 5) Confirm signup
# 6) Login and verify success

POST {{MAILSLURP_BASE_URL}}/inboxes
x-api-key: {{MAILSLURP_API_KEY}}
Content-Type: application/json
{
  "expiresIn": 300000
}
HTTP 201
[Captures]
inbox_id: jsonpath "$.id"
email_address: jsonpath "$.emailAddress"
[Asserts]
jsonpath "$.id" exists
jsonpath "$.emailAddress" exists

POST {{TEST_ENDPOINTS_BASE_URL}}/test-endpoints/sign-up
Content-Type: application/x-www-form-urlencoded
[FormParams]
emailAddress: {{email_address}}
password: {{TEST_PASSWORD}}
HTTP 200
[Asserts]
body contains "Confirmation code sent to"
body contains "/confirm?code="

POST {{MAILSLURP_BASE_URL}}/waitForMatchingEmails?inboxId={{inbox_id}}&count=1&timeout={{WAIT_TIMEOUT_MS}}&unreadOnly=true
x-api-key: {{MAILSLURP_API_KEY}}
Content-Type: application/json
{
  "matches": [
    {
      "field": "SUBJECT",
      "should": "CONTAIN",
      "value": "Please confirm your email address"
    }
  ]
}
HTTP 200
[Captures]
email_id: jsonpath "$[0].id"
[Asserts]
jsonpath "$[0].id" exists
jsonpath "$[0].subject" contains "Please confirm your email address"

POST {{MAILSLURP_BASE_URL}}/emails/{{email_id}}/contentMatch
x-api-key: {{MAILSLURP_API_KEY}}
Content-Type: application/json
{
  "pattern": "Your confirmation code is \"(\\w+)\"\\."
}
HTTP 200
[Captures]
confirmation_code: jsonpath "$.matches[1]"
[Asserts]
jsonpath "$.matches[1]" exists

POST {{TEST_ENDPOINTS_BASE_URL}}/test-endpoints/confirm
Content-Type: application/x-www-form-urlencoded
[FormParams]
emailAddress: {{email_address}}
code: {{confirmation_code}}
HTTP 200
[Asserts]
body contains "User confirmed"

POST {{TEST_ENDPOINTS_BASE_URL}}/test-endpoints/login
Content-Type: application/x-www-form-urlencoded
[FormParams]
emailAddress: {{email_address}}
password: {{TEST_PASSWORD}}
HTTP 200
[Asserts]
body contains "Login successful"
