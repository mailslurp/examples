//<gen>cypress_client_add_command
const { MailSlurp } = require('mailslurp-client');
// set your api key with an environment variable `CYPRESS_API_KEY` or configure using `env` property in config file
// (cypress prefixes environment variables with CYPRESS)
const apiKey = Cypress.env('API_KEY')
const mailslurp = new MailSlurp({ apiKey });

Cypress.Commands.add("createInbox", () => {
  return mailslurp.createInbox();
});

Cypress.Commands.add("waitForLatestEmail", (inboxId) => {
  // how long we should hold connection waiting for an email to arrive
  const timeoutMillis = 30_000;
  return mailslurp.waitForLatestEmail(inboxId, timeoutMillis)
});
//</gen>
