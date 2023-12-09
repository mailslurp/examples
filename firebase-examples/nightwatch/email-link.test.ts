import { NightwatchAPI, NightwatchTests } from "nightwatch";
import MailSlurp from "mailslurp-client";
const appUrl = "http://localhost:5173";
const apiKey = process.env.MAILSLURP_API_KEY;
if (!apiKey) {
  throw new Error("MailSlurp API key expected");
}
//<gen>firebase-email-link-test
const home: NightwatchTests = {
  "Email login link test": () => {
    // create mailslurp client for controlling emails
    const mailslurp = new MailSlurp({ apiKey });
    let inboxId = null;

    // load the example app
    browser
      .url(appUrl)
      .waitForElementVisible("body")
      .assert.titleContains("MailSlurp")
      // go to the sign in page
      .waitForElementVisible("#page-email-link")
      .click("#page-email-link")
      // assert we are no signed in
      .waitForElementVisible("#quickstart-sign-in-status")
      .assert.containsText("#quickstart-sign-in-status", "Signed out")
      // create a temp email account
      .perform(async (done) => {
        const inbox = await mailslurp.createInbox();
        inboxId = inbox.id;
        // fill the email form and submit
        browser
          .setValue("#email", inbox.emailAddress)
          .click("#quickstart-sign-in")
          .pause(1000)
          .alerts.dismiss()
        done();
      })
      // accept alert
      // now wait for email
      .perform(async (done) => {
        const waitTimeMillis = 120_000;
        const email = await mailslurp.waitForLatestEmail(
          inboxId,
          waitTimeMillis,
        );
        browser.assert.equal(
          email.body.indexOf("click this link") > -1,
          true,
          "Expect email body contains a link",
        );
        // extract the links using MailSlurp
        const links = await mailslurp.emailController.getEmailLinks({
          emailId: email.id,
        });
        browser.assert.equal(
          links.links.length,
          1,
          "Expect to find 1 link in the email",
        );
        const loginLink = links.links[0];
        browser.assert.equal(
            loginLink.indexOf('firebaseapp.com/__/auth/') > -1,
            true,
            "Expect link is well formed firebase email login link",
        );
        // now load the link in the browser
        // equivalent to clicking the link inside the email
        browser.url(loginLink);
        done()
      })
      // assert we are now signed in!
      .waitForElementVisible("#quickstart-sign-in-status")
      .assert.containsText("#quickstart-sign-in-status", "Signed In");

    // wait for verification email link to be sent

    // expect the page to display a logged in user

    browser.end();
  },
};
//</gen>
export default home;
