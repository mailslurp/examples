// configure SendGrid and MailSlurp APIs
const sendgrid = require('@sendgrid/mail');
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const senderEmail = process.env.SENDGRID_FROM_EMAIL;
if (sendgridApiKey) sendgrid.setApiKey(sendgridApiKey);
const describeWithSendGrid = process.env.API_KEY && sendgridApiKey && senderEmail ? describe : describe.skip;

const MailSlurp = require("mailslurp-client").MailSlurp;

describeWithSendGrid("my apps email action", () => {

  it("triggering the action sends an email to a user", async () => {
    const mailslurp = new MailSlurp({apiKey: process.env.API_KEY});
    // create a new email address to represent a user
    const {id, emailAddress} = await mailslurp.createInbox();
    expect(emailAddress).toContain("@");
    // trigger an action that we expect will send an email to our user
    await triggerEmailAction(emailAddress);

    // receive the email that and verify its contents
    const {subject, body} = await mailslurp.waitForLatestEmail(id, 10000);
    expect(subject).toBe('Thanks for subscribing');
    expect(body).toContain('Welcome!');
  });

  // this is what your app might do to send emails
  // we trigger it here so we can verify that emails are sent
  function triggerEmailAction(emailAddress) {
    return sendgrid.send({
      to: emailAddress,
      from: senderEmail,
      subject: 'Thanks for subscribing',
      text: 'Welcome!'
    });
  }

});
