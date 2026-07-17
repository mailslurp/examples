# MailSlurp Inbox Placement Examples

This folder contains inbox placement and domain monitor examples using the MailSlurp JavaScript SDK.

Run the import/API-surface smoke test with:

```shell
npm install
npm test
```

Run the live examples with:

```shell
API_KEY=your-api-key \
RUN_MAILSLURP_INBOX_PLACEMENT_EXAMPLES=true \
MAILSLURP_TEST_DOMAIN=mailslurp.com \
MAILSLURP_TEST_FROM_EMAIL=hello@mailslurp.com \
MAILSLURP_SENDER_INBOX_ID=your-sender-inbox-id \
npm test
```

The generated code blocks use placeholder constants such as `YOUR_API_KEY`, `YOUR_DOMAIN`, `YOUR_FROM_EMAIL`, and `YOUR_SENDER_INBOX_ID`. Define those outside of the landing-page code block, for example `YOUR_API_KEY = process.env.API_KEY` and `YOUR_DOMAIN = "mailslurp.com"`, then keep the snippets focused on the API call.
