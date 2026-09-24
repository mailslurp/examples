# Cypress MailSlurp plugin example

Sign up to the email playground with a new inbox, receive the verification email, confirm the code, and sign in.

Uses `cypress-mailslurp@2.0.0` and Cypress 16. The plugin requires Cypress 15.10 or newer for its secure `cy.env()` API. Install a supported Node.js version and Google Chrome before running.

## Run tests

Put `API_KEY=your-api-key` in this directory's `.env` or the shared `examples/.env`. The config loads it in Node and makes it available to the plugin without putting the key in the test source. An exported `CYPRESS_MAILSLURP_API_KEY` takes precedence.

```sh
npm ci
npm run typecheck
npm test
```

`make test` runs the same Chrome tests. Use `npm run dev` for the interactive Cypress runner.

The JavaScript example also waits for the verification email. The configuration tests exercise custom headers, API base paths, and `fetchApi` with both environment and explicit API keys; their HTTP responses are mocked.

## Documentation

- [Cypress Plugin source](https://github.com/mailslurp/cypress-mailslurp)
- [Plugin documentation](https://docs.mailslurp.com/cypress-mailslurp)

## Example test

```typescript
/// <reference types="cypress-mailslurp" />
describe("user sign up test with mailslurp plugin", function () {
    //<gen>cypress_plugin_before
    // use cypress-mailslurp plugin to create an email address before test
    before(function () {
        cy.log("Wrap inbox before test")
        cy.mailslurp()
            .then(mailslurp => mailslurp.createInbox())
            .then(inbox => {
                cy.log(`Inbox id ${inbox.id}`)
                // save inbox id and email address to this (make sure you use function and not arrow syntax)
                cy.wrap(inbox.id).as('inboxId')
                cy.wrap(inbox.emailAddress).as('emailAddress')
            })
    });
    //</gen>
    it("can sign up, confirm the email, and sign in", function () {
        cy.log("Run tests")
        //<gen>cypress_plugin_01
        // get wrapped email address and assert contains a mailslurp email address
        expect(this.emailAddress).to.match(/^[^@]+@[^@]+$/);
        // visit the demo application
        cy.visit("/")
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
                // allow the email wait to finish before Cypress times out
                .then({ timeout: 60_000 }, mailslurp => mailslurp.waitForLatestEmail(this.inboxId, 60_000, true))
                // extract the confirmation code from the email body
                .then(email => {
                    const code = /verification code is (\d{6})/.exec(email.body ?? '')?.[1]
                    if (!code) throw new Error('Verification email did not contain a six-digit code')
                    return code
                })
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
