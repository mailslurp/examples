# Cypress MailSlurp SMS example

Sign up to the SMS playground with an existing US phone number, receive the verification SMS, confirm the code, and sign in.

Uses `cypress-mailslurp@2.0.0` and Cypress 16. The plugin requires Cypress 15.10 or newer for its secure `cy.env()` API. Install a supported Node.js version and Google Chrome before running.

## Run tests

Put `API_KEY=your-api-key` in this directory's `.env` or the shared `examples/.env`. The config loads it in Node and makes it available to the plugin without putting the key in the test source. An exported `CYPRESS_MAILSLURP_API_KEY` takes precedence.

```sh
npm ci
npm run typecheck
npm test
```

`make test` runs the same Chrome tests. Use `npm run dev` for the interactive Cypress runner.

The account needs an existing US MailSlurp number that has not already registered with the SMS playground. This example does not purchase a number. The test fails with an actionable message if no US number is available.

Signup, SMS confirmation, and login stay in one test because Cypress resets aliases between tests. The SMS wait filters messages received since this run began, preventing an older unread code from being used.

## Documentation

- [Cypress Plugin source](https://github.com/mailslurp/cypress-mailslurp)
- [Plugin documentation](https://docs.mailslurp.com/cypress-mailslurp)

## Example test

```typescript
/// <reference types="cypress-mailslurp" />
import { GetPhoneNumbersPhoneCountryEnum } from 'mailslurp-client'

describe('SMS signup with the MailSlurp plugin', function () {
    it('can sign up, confirm the SMS code, and sign in', function () {
        const since = new Date()

        //<gen>cypress_sms_plugin_before
        // Select an existing US number; this test does not purchase a number.
        cy.mailslurp()
            .then(mailslurp => mailslurp.phoneController.getPhoneNumbers({
                phoneCountry: GetPhoneNumbersPhoneCountryEnum.US,
            }))
            .then(phones => {
                // Paginated APIs may omit the total count, so inspect the returned records.
                const phone = phones.content?.[0]
                if (!phone) {
                    throw new Error('This example requires an existing US MailSlurp phone number. Configure an API key for an account with a US number that has not signed up to the SMS playground.')
                }
                cy.wrap(phone.id, { log: false }).as('phoneNumberId')
                cy.wrap(phone.phoneNumber, { log: false }).as('phoneNumber')
            })
        //</gen>

        //<gen>cypress_sms_plugin_01
        cy.then(function () {
            expect(this.phoneNumber).to.match(/^\+1[0-9]{10}$/)
            cy.visit('/')
            cy.title().should('contain', 'React App')
        })
        //</gen>

        //<gen>cypress_sms_plugin_02
        cy.get('[data-test=sign-in-create-account-link]').click()
        cy.then(function () {
            cy.get('[name=phone_line_number]').type(this.phoneNumber.slice(2))
            cy.get('[name=password]').type('test-password')
            cy.get('[data-test=sign-up-create-account-button]').click()
        })
        //</gen>

        //<gen>cypress_sms_plugin_03
        cy.mailslurp()
            .then({ timeout: 60_000 }, function (mailslurp) {
                return mailslurp.waitController.waitForLatestSms({
                    waitForSingleSmsOptions: {
                        phoneNumberId: this.phoneNumberId,
                        unreadOnly: true,
                        since,
                        timeout: 60_000,
                    },
                })
            })
            .then(sms => {
                const code = /\b([0-9]{6})\b/.exec(sms.body ?? '')?.[1]
                if (!code) throw new Error('Verification SMS did not contain a six-digit code')
                cy.get('[data-test=confirm-sign-up-confirmation-code-input]').type(code)
                cy.get('[data-test=confirm-sign-up-confirm-button]').click()
            })
        //</gen>

        //<gen>cypress_sms_plugin_04
        cy.then(function () {
            cy.get('[data-test=username-input]').type(this.phoneNumber)
            cy.get('[data-test=sign-in-password-input]').type('test-password')
            cy.get('[data-test=sign-in-sign-in-button]').click()
        })
        //</gen>

        //<gen>cypress_sms_plugin_05
        cy.get('h1').should('contain', 'Welcome')
        //</gen>
    })
})
```
