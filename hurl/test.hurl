# Step 1: Create an inbox with defaults
POST https://api.mailslurp.com/inboxes/withDefaults
x-api-key: {{API_KEY}}

HTTP/1.1 201
[Asserts]
jsonpath "$.id" exists
jsonpath "$.emailAddress" exists

[Captures]
emailId = jsonpath "$.id"
emailAddress = jsonpath "$.emailAddress"

# Step 2: Retrieve emails for the created inbox
GET https://api.mailslurp.com/inboxes/{{emailId}}/emails
x-api-key: {{API_KEY}}

HTTP/1.1 200
[Asserts]
jsonpath "$.content[0].id" exists
jsonpath "$.content[0].subject" exists
