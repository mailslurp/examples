/**
 * Test user sign-up using a new email address
 *
 * We will use the MailSlurp test authentication playground
 */
describe('Sign up', () => {

  it('can load oauth demo site', () => {
    cy.visit('https://playground.mailslurp.com');
    cy.contains('Sign in to your account');
  });

  it('can click sign up link', () => {
    cy.get('[data-test="sign-in-create-account-link"]').click();
    cy.contains('Testable Sign Up Form');
  });

  const password = "test-password";
  let inboxId;
  let emailAddress;
  let code;

  it('can generate a new email address and sign up', () => {
    // see commands.js custom commands
    cy.createInbox().then(inbox => {
      // verify a new inbox was created
      assert.isDefined(inbox)

      // save the inboxId for later checking the emails
      inboxId = inbox.id
      emailAddress = inbox.emailAddress;

      // sign up with inbox email address and the password
      cy.get('input[name=email]').type(emailAddress);
      cy.get('input[name=password]').type(password);
      cy.get('[data-test="sign-up-create-account-button"]').click();
    });
  });

  it('can receive the confirmation email and extract the code', () => {
    // wait for an email in the inbox
    cy.waitForLatestEmail(inboxId).then(email => {
      // verify we received an email
      assert.isDefined(email);

      // verify that email contains the code
      assert.strictEqual(/verification code is/.test(email.body), true);

      // extract the confirmation code (so we can confirm the user)
      code = /([0-9]{6})$/.exec(email.body)[1];
    });
  });

  it('can enter confirmation code and confirm user', () => {
    assert.isDefined(code);
    cy.get('[data-test="confirm-sign-up-confirmation-code-input"]').type(code);
    cy.get('[data-test="confirm-sign-up-confirm-button"]').click();
  });

  it('can log in with confirmed account', () => {
    cy.contains('Sign in to your account');
    // fill out username (email) and password
    cy.get('[data-test="username-input"]').type(emailAddress);
    cy.get('[data-test="sign-in-password-input"]').type(password);
    // submit
    cy.get('[data-test="sign-in-sign-in-button"]').click();
  });

  it('shows the successful greeting', () => {
    cy.contains("Welcome");
  });

});
