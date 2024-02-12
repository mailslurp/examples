# Cypress MailSlurp plugin example
How to use MailSlurp with Cypress JS. Loads a demonstration app, signs up with a new email address, receives confirmation code, extracts code and submits. Sees welcome screen.

## Documentation
- [Cypress Plugin source](https://github.com/mailslurp/cypress-mailslurp)
- [Plugin documentation](https://docs.mailslurp.com/cypress-mailslurp)

## Run tests
`API_KEY=your-api-key make test`

## Example test

```typescript
/// <reference types="cypress-mailslurp" />

describe("user sign up test with mailslurp plugin", function () {
    //<gen>cypress_plugin_before
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
    //</gen>
    it("01 - can load the demo application", function () {
        //<gen>cypress_plugin_01
        // get wrapped email address and assert contains a mailslurp email address
        expect(this.emailAddress).to.contain("@mailslurp");
        // visit the demo application
        cy.visit("https://playground.mailslurp.com")
        cy.title().should('contain', 'React App');
        //</gen>
        //<gen>cypress_plugin_02
        cy.then(function () {
            // click sign up and fill out the form
            cy.get("[data-test=sign-in-create-account-link]").click()
            // use the email address and a test password
            cy.get("[name=email]").type(this.emailAddress).trigger('change');
            cy.get("[name=password]").type('test-password').trigger('change');
            // click the submit button
            cy.get("[data-test=sign-up-create-account-button]").click();
            //</gen>
        })
        //<gen>cypress_plugin_03
        cy.then(function () {
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
        })
        //</gen>
        //<gen>cypress_plugin_04
        // fill out sign in form
        cy.then( function () {
            // use the email address and a test password
            cy.get("[data-test=username-input]").type(this.emailAddress).trigger('change');
            cy.get("[data-test=sign-in-password-input]").type('test-password').trigger('change');
            // click the submit button
            cy.get("[data-test=sign-in-sign-in-button]").click();
        });
        //</gen>
        //<gen>cypress_plugin_05
        // can see authorized welcome screen
        cy.then(function () {
            // click sign up and fill out the form
            cy.get("h1").should("contain", "Welcome");
        })
        //</gen>
    });
});
```
