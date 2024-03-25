import { MailSlurp } from 'mailslurp-client';

describe('open an email', () => {
  it('can open emails', () => {
    cy.then(() => {
      cy.log('Configure mailslurp')
      const mailslurp = new MailSlurp({ apiKey: Cypress.env('API_KEY') })
      cy.wrap(mailslurp).as('mailslurp')
    });
    
    cy.then(function () {
      cy.log('Create an inbox')
      return this.mailslurp.inboxController.createInboxWithDefaults()
    }).then(inbox => {
      cy.wrap(inbox.id).as('inboxId')
      cy.wrap(inbox.emailAddress).as('emailAddress')
    });

    cy.then(function () {
      cy.log('Send email')
      return this.mailslurp.sendEmail(this.inboxId, {
        to: [this.emailAddress],
        subject: 'Test email',
        body: 'This is a test'
      })
    });

    cy.then(function () {
      cy.log('Wait for email')
      return this.mailslurp.waitForLatestEmail(this.inboxId, 120_000, true)
    }).then(email => {
      expect(email.subject).to.contain('Test email')
      cy.wrap(email.id).as('emailId')
    });

    cy.then(function () {
      return this.mailslurp.emailController.getEmailPreviewURLs({ emailId: this.emailId })
    }).then(previewUrls => {
      cy.visit(previewUrls.plainHtmlBodyUrl)
      cy.get('body').contains('This is a test')
    })
  })
})
