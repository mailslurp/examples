//<gen>cypress_client_add_command
const { MailSlurp } = require('mailslurp-client');
// set your api key with an environment variable `CYPRESS_API_KEY` or configure using `env` property in config file
// (cypress prefixes environment variables with CYPRESS)
const apiKey = Cypress.env('API_KEY')
const mailslurp = new MailSlurp({ apiKey });

Cypress.Commands.add('createInbox', () => {
  // wrap the promise so it becomes a Cypress chainable
  return cy.wrap(mailslurp.createInbox(), { log: false })
})

Cypress.Commands.add('waitForLatestEmail', (inboxId, timeoutMillis = 30_000) => {
  return cy.wrap(mailslurp.waitForLatestEmail(inboxId, timeoutMillis), { log: false })
})
//</gen>
