/**
 * Test user sign-up using a new email address
 *
 * We will use the MailSlurp test authentication playground
 */

describe('Sign up', () => {
  const password = "test-password";

  it('can load oauth demo site and complete sign up', () => {
    cy.visit('/');
    cy.contains('Sign in to your account');
    cy.get('[data-test="sign-in-create-account-link"]').click();
    cy.contains('Testable Sign Up Form');

    // Create an inbox, use it to sign up, then wait for the email.
    return cy.createInbox().then(({ id, emailAddress }) => {
      // Fill the form with the generated address
      cy.get('input[name=email]').type(emailAddress);
      cy.get('input[name=password]').type(password);
      cy.get('[data-test="sign-up-create-account-button"]').click();

      // Wait for the verification email for this exact inbox
      return cy.waitForLatestEmail(id).then((email) => {
        expect(email).to.exist;
        expect(/verification code is/.test(email.body)).to.equal(true);

        const match = email.body.match(/([0-9]{6})$/);
        expect(match, '6 digit verification code present').to.not.be.null;
        const code = match[1];

        // Confirm sign up with the received code
        cy.get('[data-test="confirm-sign-up-confirmation-code-input"]').type(code);
        cy.get('[data-test="confirm-sign-up-confirm-button"]').click();

        // Now sign in using the same email and password
        cy.contains('Sign in to your account');
        cy.get('[data-test="username-input"]').type(emailAddress);
        cy.get('[data-test="sign-in-password-input"]').type(password);
        cy.get('[data-test="sign-in-sign-in-button"]').click();
        cy.contains('Welcome');
      });
    });
  });
});
