Cypress.config('defaultCommandTimeout', 10000);

describe('can sign up for newsletter', () => {
  it('can enter email and receive confirmation', () => {
    let ms;
    let inbox;

    //<gen>cypress_newsletter_client_2
    // Create a MailSlurp client with the API key
    cy.then(() => {
      cy.log('Create MailSlurp client with API KEY')
      const MailSlurp = require('mailslurp-client').default
      ms = new MailSlurp({ apiKey: Cypress.env('MAILSLURP_API_KEY') })
    })
    //</gen>

    //<gen>cypress_newsletter_inbox_3
    // Create a disposable inbox
    cy.then(() => {
      cy.log('Create a disposable inbox')
      return ms.inboxController.createInboxWithOptions({
        createInboxDto: {
          expiresIn: 300_000
        }
      })
    }).then(created => {
      inbox = created;
      cy.log(`Created inbox ${inbox.emailAddress}, storing for later use`)
    })
    //</gen>

    //<gen>cypress_newsletter_visit_4
    // visit the newsletter page and fill in the form
    cy.visit('https://newsletter.mailslurp.biz')
    //</gen>

    cy.screenshot('cypress-newsletter-page-01.png')

    //<gen>cypress_newsletter_fill_5
    cy.then(() => {
      cy.log('Enter email address and submit')
      cy.get('#email').type(inbox.emailAddress)
      cy.get('#name').type('Jack')
      cy.get('#submit').click()
      cy.get('[data-state="submitted"]').should('be.visible')
    })
    //</gen>

    cy.screenshot('cypress-newsletter-page-02.png')

    //<gen>cypress_newsletter_confirm_6
    // wait for the confirmation email
    cy.then( () => {
      return ms.waitForLatestEmail(inbox.id, 120_000, true)
    }).then(email => {
      expect(email.subject).to.eq('Welcome to my newsletter')
      expect(email.body).to.contain('Jack')
      cy.wrap(email.id).as('emailId')
    })
    //</gen>

    //<gen>cypress_newsletter_view_7
    // open the email to view it in cypress
    cy.get('@emailId').then(emailId => {
      cy.log('Get url for viewing email')
      return ms.emailController.getEmailPreviewURLs({ emailId })
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