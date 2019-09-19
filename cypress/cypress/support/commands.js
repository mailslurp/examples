const { MailSlurp } = require('mailslurp-client');

Cypress.Commands.add("newEmailAddress", () => {
  const mailslurp = new MailSlurp({ apiKey: Cypress.env('API_KEY')});
  return mailslurp.createInbox();
});
