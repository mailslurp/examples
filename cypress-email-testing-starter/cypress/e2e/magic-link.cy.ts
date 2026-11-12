/// <reference types="cypress-mailslurp" />

describe('magic link sign-in', () => {
  beforeEach(() => {
    // A fresh, real email address for each test. It expires after ten minutes.
    cy.mailslurp()
      .then((mailslurp) => mailslurp.createInboxWithOptions({ expiresIn: 10 * 60_000 }))
      .then((inbox) => {
        cy.wrap(inbox.id).as('inboxId');
        cy.wrap(inbox.emailAddress).as('emailAddress');
      });
  });

  it('signs in with the link sent to the inbox', function () {
    cy.visit('magic-link');
    cy.get('[data-testid=emailAddress]').type(this.emailAddress);
    cy.get('[data-testid=submit]').click();

    cy.mailslurp()
      // unreadOnly=true: ignore anything this inbox has already seen
      .then({ timeout: 70_000 }, (mailslurp) => mailslurp.waitForLatestEmail(this.inboxId, 60_000, true))
      .then((email) => {
        expect(email.subject).to.match(/confirm your email/i);
        return cy
          .mailslurp()
          .then((mailslurp) =>
            mailslurp.emailController.getEmailLinks({ emailId: email.id, selector: '.confirm-btn' }),
          );
      })
      .then(({ links }) => {
        expect(links).to.have.length(1);
        cy.visit(links[0]);
      });

    cy.get('[data-el="dashboard-success"]').should('be.visible');
  });
});
