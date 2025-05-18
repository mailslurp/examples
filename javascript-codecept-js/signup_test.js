Feature('signup');

const MY_APPLICATION = 'https://playground.mailslurp.com'

Scenario('Test user sign up',  async ({ I }) => {
    //<gen>codeceptjs_signup_and_extract
    // create a dummy inbox with MailSlurp
    const emailAccount = await I.haveNewMailbox()
    const password = 'test-password';

    // load application
    I.amOnPage(MY_APPLICATION);

    // fill signup form
    I.click('[data-test="sign-in-create-account-link"]')
    I.fillField('[name="email"]', emailAccount.emailAddress);
    I.fillField('[name="password"]', password);
    I.click('[data-test="sign-up-create-account-button"]');

    // wait for confirmation email
    const email = await I.waitForEmailMatching({
        subject: "Please confirm your email address"
    })
    // extract content use regex pattern
    const [_, code] = /verification code is (\d+)/.exec(email.body)

    // submit verification code
    I.fillField('[name="code"]', code)
    I.click('[data-test="confirm-sign-up-confirm-button"]');
    //</gen>
    // now login with verified account
    I.fillField('[name="username"]', emailAccount.emailAddress);
    I.fillField('[name="password"]', password);
    I.click('[data-test="sign-in-sign-in-button"]');
    // see welcome message
    I.waitForElement('img[src*="welcome"]', 30);
});
