# JavaScript email workflows

Use Node.js 20 or newer. Install the pinned SDK and run two email-only checks:

```sh
npm install
MAILSLURP_API_KEY=your-key npm run email
```

The program creates one temporary inbox for each check, sends to that returned address, waits up
to 30 seconds and checks the OTP or message content. Expect `Email OTP matched` and
`Sent and received the test email`. Both inboxes are deleted in finally blocks and also expire
after five minutes. An API key and email sending/receiving access are required.

`workflows.js` also contains separate phone, webhook and device-rendering examples. These are not
run by `npm run email`. Replace their explicit resource-ID/receiver placeholders first. Phone
requires an existing owned number and may incur SMS charges; webhook requires your reachable
HTTPS receiver; device rendering requires an existing email and device-preview access. The webhook
example registers a receiver; verify delivery at your application and use the shown deletion call
when finished. The rendering example creates a run and waits at most 30 seconds; an unfinished run
can be inspected again using its run ID.

The `<gen>` regions are the canonical source for the webapp's task-specific examples. Framework
wrappers and installation instructions are added by the webapp shortcode generator.
