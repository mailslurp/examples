const assert = require('assert');
const MailSlurp = require('mailslurp-client').default;
const mailslurp = new MailSlurp({ apiKey: process.env.API_KEY });

describe('sign-up process', () => {

  it('can load oauth demo site', async () => {
    await page.goto('https://playground.mailslurp.com')
    await expect(page).toMatch('Sign in to your account')
  })

  it('can click sign up link', async () => {
    await expect(page).toClick('[data-test="sign-in-create-account-link"]')
    await expect(page).toMatch('Testable Sign Up Form')
  })

  const password = "test-password";
  let inbox;
  let code;

  it('can sign-up with a new email address', async () => {
    // create a new email address for the test run
    inbox = await mailslurp.createInbox();

    // fill out the new user form with generating email address
    await expect(page).toFillForm('[data-test="sign-up-body-section"]', {
      email: inbox.emailAddress,
      password: password
    })
    
    // submit the new user form (which will send a confirmation email)
    await expect(page).toClick('[data-test="sign-up-create-account-button"]')
  });

  it('can fetch confirmation code', async () => {
    // fetch the email from mailslurp
    const email = await mailslurp.waitForLatestEmail(inbox.id)

    // verify that it contains the code
    assert.strictEqual(/verification code is/.test(email.body), true);

    // extract the confirmation code
    code = /([0-9]{6})$/.exec(email.body)[1]
  });

  it('can enter confirmation code and confirm user', async () => {
    await expect(page).toFillForm('[data-test="confirm-sign-up-body-section"]', {
      code: code
    })
    await expect(page).toClick('[data-test="confirm-sign-up-confirm-button"]')
  });

  it('can log in with confirmed account', async () => {
    await expect(page).toMatch('Sign in to your account')
    // fill out username (email) and password
    await expect(page).toFillForm('#root', {
      username: inbox.emailAddress,
      password: password
    })
    // submit
    await expect(page).toClick('[data-test="sign-in-sign-in-button"]')
  });

  it('shows the successful greeting', async () => {
    await page.waitForFunction('document.body.innerText.includes("Welcome")');
    await expect(page).toMatchElement('h1', { text: 'Welcome' })
  });
})
