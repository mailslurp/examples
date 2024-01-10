import { NightwatchAPI, NightwatchTests } from "nightwatch";
import MailSlurp from "mailslurp-client";
const appUrl = "http://localhost:5173";
const apiKey = process.env.MAILSLURP_API_KEY;
if (!apiKey) {
  throw new Error("MailSlurp API key expected");
}
const home: NightwatchTests = {
  "Email login link test": () => {
    //<gen>firebase_email_link_test_00
    // create mailslurp client for controlling emails
    const mailslurp = new MailSlurp({ apiKey });
    let inbox = null;
    let loginLink = null;
    //</gen>

    // load the example app
    browser
      .perform(async (done) => {
        //<gen>firebase_email_link_test_01
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
          .screenshot("./screenshots/firebase-email-link-01.png", () => {
            done();
          });
        //</gen>
      })
      .perform(async (done) => {
        //<gen>firebase_email_link_test_02
        // create a temp email account
        inbox = await mailslurp.createInbox();
        // fill the email form and submit
        browser
          .setValue("#email", inbox.emailAddress)
          .click("#quickstart-sign-in", () => {
            done();
          });
        //</gen>
      })
      .pause(1000)
      // accept alert
      .getAlertText((result) => {
        browser.assert.equal(
          result.value.indexOf(inbox.emailAddress) > -1,
          true,
          "Alert shows user email address",
        );
      })
      .acceptAlert()
      .perform(async (done) => {
        //<gen>firebase_email_link_test_03
        // now wait for email
        const waitTimeMillis = 120_000;
        const email = await mailslurp.waitForLatestEmail(
          inbox.id,
          waitTimeMillis,
        );
        //</gen>
        //<gen>firebase_email_link_test_04
        browser.assert.equal(
          email.body.indexOf("click this link") > -1,
          true,
          "Expect email body contains a link",
        );
        //</gen>
        //<gen>firebase_email_link_test_05
        // extract the links using MailSlurp
        const links = await mailslurp.emailController.getEmailLinks({
          emailId: email.id,
        });
        browser.assert.equal(
          links.links.length,
          1,
          "Expect to find 1 link in the email",
        );
        loginLink = links.links[0];
        //</gen>
        //<gen>firebase_email_link_test_06
        browser.assert.equal(
          loginLink.indexOf("firebaseapp.com/__/auth/") > -1,
          true,
          "Expect link is well formed firebase email login link",
        );
        // now load the link in the browser
        // equivalent to clicking the link inside the email
        browser.url(loginLink, () => {
          done();
        });
        //</gen>
      })
      // assert we are now signed in!
      .waitForElementVisible("#quickstart-sign-in-status")
      .assert.containsText("#quickstart-sign-in-status", "Signed In")
      .end();
  },
};
export default home;
