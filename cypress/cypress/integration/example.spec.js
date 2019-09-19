/**
 * Demonstrate a dummy sign up using a random email address
 */
describe('Sign up', () => {
  context('Example sign up page', () => {
    it('can generate a new email address to test sign up', () => {
      cy.newEmailAddress().then(({ emailAddress }) => {
        cy.visit('https://example.cypress.io/commands/actions');
        cy.get('input[type=email]').type(emailAddress);
        cy.get('input[type=email]').should('contain.value', '@mailslurp.com');
        // submit the form, get the verification code, verify the user (see docs for those examples)
      });
    });
  })
});
