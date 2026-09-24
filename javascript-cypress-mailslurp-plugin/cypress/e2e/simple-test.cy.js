/// <reference types="cypress-mailslurp" />

describe("single pass", function () {
    it("can sign up and receive", function () {
        const yourApplication = "https://playground.mailslurp.com"
        const signupLink = "[data-test=sign-in-create-account-link]"
        const submitButton = "[data-test=sign-up-create-account-button]"
        //<gen>cypress_single_example
        cy.mailslurp()
            .then(mailslurp => mailslurp.createInbox())
            .then(inbox => {
                cy.visit(yourApplication)
                cy.get(signupLink).click()
                // fill form with new email address
                cy.get("[name=email]").type(inbox.emailAddress).trigger('change');
                cy.get("[name=password]").type('test-password').trigger('change');
                // submit user
                cy.get(submitButton).click();
                // store inbox for later
                cy.wrap(inbox.id).as('inboxId')
            })
        cy.mailslurp()
            .then({ timeout: 60_000 }, function (mailslurp) {
                return mailslurp.waitForLatestEmail(this.inboxId, 60_000, true)
            })
            .then(email => {
                expect(email.body).to.match(/verification code is [0-9]{6}/)
            })
        //</gen>
    });
});
