import { MailSlurp } from 'mailslurp-client';

describe('open an email', () => {
  it('can open emails', () => {
    let ms;

    cy.then(() => {
      cy.log('Configure MailSlurp');
      ms = new MailSlurp({ apiKey: Cypress.env('API_KEY') });
    })
      // create an inbox
      .then(() => {
        cy.log('Create an inbox');
        return ms.inboxController.createInboxWithDefaults();
      })
      // send an email
      .then((inbox) => {
        const { id, emailAddress } = inbox;
        cy.log(`Inbox created: ${id}`);

        return cy
          .then(() => {
            cy.log('Send email');
            return ms.sendEmail(id, {
              to: [emailAddress],
              subject: 'Test email',
              body: 'This is a test',
            });
          })
          // wait for the email
          .then({ timeout: 130_000 }, () => {
            cy.log('Wait for email');
            return ms.waitForLatestEmail(id, 120_000, true);
          })
          // open and check preview
          .then((email) => {
            expect(email.subject).to.contain('Test email');
            return ms.emailController.getEmailPreviewURLs({ emailId: email.id });
          })
          .then((previewUrls) => {
            cy.request(previewUrls.plainHtmlBodyUrl).then((x) => {
               x.body.includes('This is a test');
            })
          });
      });
  });
});