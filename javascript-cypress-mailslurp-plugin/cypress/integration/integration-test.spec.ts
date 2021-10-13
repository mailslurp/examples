/// <reference types="cypress-mailslurp" />

describe("user sign up test with mailslurp plugin", function () {
    // use cypress-mailslurp plugin to create an email address before test
    before(function () {
        cy.log("Wrap inbox before test")
        return cy.mailslurp()
            .then(mailslurp => mailslurp.createInbox())
            .then(inbox => {
                cy.log(`Inbox id ${inbox.id}`)
                // save inbox id and email address to this (make sure you use function and not arrow syntax)
                cy.wrap(inbox.id).as('inboxId')
                cy.wrap(inbox.emailAddress).as('emailAddress')
            })
    });
    it("01 - can load the demo application", function () {
        // get wrapped email address and assert contains a mailslurp email address
        expect(this.emailAddress).to.contain("@mailslurp");
        // visit the demo application
        cy.visit("https://playground.mailslurp.com")
        cy.title().should('contain', 'React App');
    });
    // use function instead of arrow syntax to access aliased values on this
    it("02 - can sign up using email address", function () {
        // click sign up and fill out the form
        cy.get("[data-test=sign-in-create-account-link]").click()
        // use the email address and a test password
        cy.get("[name=email]").type(this.emailAddress).trigger('change');
        cy.get("[name=password]").type('test-password').trigger('change');
        // click the submit button
        cy.get("[data-test=sign-up-create-account-button]").click();
    });
    it("03 - can receive confirmation code by email", function () {
        // app will send user an email containing a code, use mailslurp to wait for the latest email
        cy.mailslurp()
            // use inbox id and a timeout of 30 seconds
            .then(mailslurp => mailslurp.waitForLatestEmail(this.inboxId, 30000, true))
            // extract the confirmation code from the email body
            .then(email => /.*verification code is (\d{6}).*/.exec(email.body!!)!![1])
            // fill out the confirmation form and submit
            .then(code => {
                cy.get("[name=code]").type(code).trigger('change');
                cy.get("[data-test=confirm-sign-up-confirm-button]").click();
            })
    });
    // fill out sign in form
    it("04 - can sign in with confirmed account", function () {
        // use the email address and a test password
        cy.get("[data-test=username-input]").type(this.emailAddress).trigger('change');
        cy.get("[data-test=sign-in-password-input]").type('test-password').trigger('change');
        // click the submit button
        cy.get("[data-test=sign-in-sign-in-button]").click();
    });
    // can see authorized welcome screen
    it("05 - can see welcome screen", function () {
        // click sign up and fill out the form
        cy.get("h1").should("contain", "Welcome");
    });
});