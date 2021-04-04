import { Selector } from "testcafe";
import { MailSlurp } from "mailslurp-client";

let mailslurp;
const password = "test-password";

fixture`mfa sign-up test`.page`https://playground.mailslurp.com`.before(
  async (_) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw "No MailSlurp API KEY defined";
    }
    mailslurp = new MailSlurp({ apiKey });
  }
);

test("Can sign-up and verify account", async (t) => {
  // create email address for a test user
  const inbox = await mailslurp.inboxController.createInbox();
  // load the page and click sign up
  await t
    .expect(Selector("title").innerText)
    .eql("React App")
    .click(Selector("[data-test=sign-in-create-account-link]"));
  // wait for sign up form then fill with email address and sign up
  const emailInput = await Selector('[name="email"]')();
  await t
    .typeText(emailInput, inbox.emailAddress)
    .typeText(Selector('[name="password"]'), password)
    .click(Selector("[data-test=sign-up-create-account-button]"));
  // wait for verification code to arrive to email then extract code
  const email = await mailslurp.waitController.waitForLatestEmail(
    inbox.id,
    30000,
    true
  );
  // use regex to extract the confirmation code which is 6 digits
  const code = /([0-9]{6})$/.exec(email.body)[1];
  // now enter code to confirm
  await t
    .typeText(Selector('[name="code"]'), code)
    .click(Selector('[data-test="confirm-sign-up-confirm-button"]'));
  // now sign up
  const username = await Selector('[name="username"]')();
  await t
    .typeText(username, inbox.emailAddress)
    .typeText(Selector('[name="password"]'), password);
  const signIn = await Selector("[data-test=sign-in-sign-in-button]")();
  await t.click(signIn);
  // wait for sign up
  const h1 = await Selector("h1")();
  await t.expect(h1.innerText).eql("Welcome");
});
