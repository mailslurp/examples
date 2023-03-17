/// <reference types="cypress-mailslurp" />

describe("user sign up test with mailslurp plugin", function () {
    //<gen>cypress_sms_plugin_before
    // use cypress-mailslurp plugin to fetch a phone number we created
    before(function () {
        cy.log("Wrap phone before test")
        return cy.mailslurp()
            // fetch a phone number using the phone controller on the mailslurp instance
            .then(mailslurp => mailslurp.phoneController.getPhoneNumbers({
                phoneCountry: 'US' as any,
            }))
            .then(phones => {
                // insure you have phone number created in dashboard
                expect(phones.totalElements).gt(0);
                // IMPORTANT STEP, add the phone number details to the test context using `cy.wrap`
                const phoneNumber = phones.content![0];
                cy.log(`Phone id ${phoneNumber.id}`)
                cy.wrap(phoneNumber.id).as('phoneNumberId')
                cy.wrap(phoneNumber.phoneNumber).as('phoneNumber')
            })
    });
    //</gen>
    //<gen>cypress_sms_plugin_01
    it("01 - can load the demo sms application", function () {
        // get wrapped phone number and assert is a US number
        expect(this.phoneNumber).to.contain("+1");
        // visit the demo application
        cy.visit("https://playground-sms.mailslurp.com")
        cy.title().should('contain', 'React App');
    });
    //</gen>
    //<gen>cypress_sms_plugin_02
    // use function instead of arrow syntax to access aliased values on this
    it("02 - can sign up using phone number", function () {
        // click sign up and fill out the form
        cy.get("[data-test=sign-in-create-account-link]").click()
        // use the phone number and a test password
        cy.get("[name=phone_line_number]").type(this.phoneNumber.replace('+1', '')).trigger('change');
        cy.get("[name=password]").type('test-password').trigger('change');
        // click the submit button
        cy.get("[data-test=sign-up-create-account-button]").click();
    });
    //</gen>
    //<gen>cypress_sms_plugin_03
    it("03 - can receive confirmation code by SMS", function () {
        // app will send user an SMS containing a code, use mailslurp to wait for method to wait for the latest SMS to arrive then read the code
        cy.mailslurp()
            // use inbox id and a timeout of 30 seconds
            .then(mailslurp => mailslurp.waitController.waitForLatestSms({
                waitForSingleSmsOptions: {
                    phoneNumberId: this.phoneNumberId,
                    unreadOnly: true,
                    timeout: 30_000,
                }
            }))
            // extract the confirmation code from the SMS body
            .then(sms => /([0-9]{6})$/.exec(sms.body!!)!![1])
            // fill out the confirmation form and submit
            .then(code => {
                cy.get("[data-test=\"confirm-sign-up-confirmation-code-input\"]").type(code).trigger('change');
                cy.get("[data-test=confirm-sign-up-confirm-button]").click();
            })
    });
    //</gen>
    //<gen>cypress_sms_plugin_04
    // fill out sign in form
    it("04 - can sign in with confirmed account", function () {
        // use the email address and a test password
        cy.get("[data-test=username-input]").type(this.emailAddress).trigger('change');
        cy.get("[data-test=sign-in-password-input]").type('test-password').trigger('change');
        // click the submit button
        cy.get("[data-test=sign-in-sign-in-button]").click();
    });
    //</gen>
    //<gen>cypress_sms_plugin_05
    // can see authorized welcome screen
    it("05 - can see welcome screen", function () {
        // click sign up and see welcome
        cy.get("h1").should("contain", "Welcome");
    });
    //</gen>
});