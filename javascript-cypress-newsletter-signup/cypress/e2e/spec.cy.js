Cypress.config('defaultCommandTimeout', 10000);

describe('can sign up for newsletter', () => {
  it('can enter email and receive confirmation', () => {
    //<gen>cypress_newsletter_client_2
    // Create a MailSlurp client with the API key
    cy.then(() => {
      cy.log('Create MailSlurp client with API KEY')
      const MailSlurp = require('mailslurp-client').default
      const mailslurp = new MailSlurp({apiKey: Cypress.env('MAILSLURP_API_KEY')})
      cy.wrap(mailslurp).as('mailslurp')
    })
    //</gen>
    //<gen>cypress_newsletter_inbox_3
    // Create a disposable inbox
    cy.then(function () {
      cy.log('Create a disposable inbox')
      return this.mailslurp.inboxController.createInboxWithOptions({
        createInboxDto: {
          expiresIn: 300_000
        }
      })
    }).then(inbox => {
        cy.log(`Created inbox ${inbox.emailAddress}, storing for later use`)
        cy.wrap(inbox).as('inbox')
    })
    //</gen>
    //<gen>cypress_newsletter_visit_4
    // visit the newsletter page and fill in the form
    cy.visit('https://newsletter.mailslurp.biz')
    //</gen>
    cy.screenshot('cypress-newsletter-page-01.png')
    //<gen>cypress_newsletter_fill_5
    cy.then(function() {
      cy.log('Enter email address and submit')
      cy.get('#email').type(this.inbox.emailAddress)
      cy.get('#name').type('Jack')
      cy.get('#submit').click()
      cy.get('[data-state="submitted"]').should('be.visible')
    })
    //</gen>
    cy.screenshot('cypress-newsletter-page-02.png')
    //<gen>cypress_newsletter_confirm_6
    // wait for the confirmation email
    cy.then(function () {
      return this.mailslurp.waitForLatestEmail(this.inbox.id, 120_000, true)
    }).then(email => {
      expect(email.subject).to.eq('Welcome to my newsletter')
      expect(email.body).to.contain('Jack')
      cy.wrap(email.id).as('emailId')
    })
    //</gen>
    //<gen>cypress_newsletter_view_7
    // open the email to view it in cypress
    cy.then(function () {
      cy.log('Get url for viewing email')
      return this.mailslurp.emailController.getEmailPreviewURLs({
        emailId: this.emailId
      })
    }).then(emailPreviewUrls => {
      cy.log(`Open email in browser: ${emailPreviewUrls.html}`)
      return cy.origin(emailPreviewUrls.origin, { args: { url: emailPreviewUrls.plainHtmlBodyUrl } }, ({ url }) => {
        cy.visit(url)
        cy.get('body').contains('Jack')
        cy.screenshot('cypress-open-email')
      })
    })
    //</gen>
  })
})