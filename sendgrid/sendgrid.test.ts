// configure SendGrid and MailSlurp APIs
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

const MailSlurp = require("mailslurp-client").default;
const mailslurp = new MailSlurp({apiKey: process.env.API_KEY});

describe("my apps email action", () => {

  it("triggering the action sends an email to a user", async () => {
    // create a new email address to represent a user
    const {id, emailAddress} = await mailslurp.createInbox();
    expect(emailAddress).toContain("@mailslurp.com");
    // trigger an action that we expect will send an email to our user
    triggerEmailAction(emailAddress);

    // receive the email that and verify its contents
    const {subject, body} = await mailslurp.waitForLatestEmail(id, 10000);
    expect(subject).toBe('Thanks for subscribing');
    expect(body).toContain('Welcome!');
  });

  // this is what your app might do to send emails
  // we trigger it here so we can verify that emails are sent
  function triggerEmailAction(emailAddress) {
    sendgrid.send({
      to: emailAddress,
      from: 'example@example.com',
      subject: 'Thanks for subscribing',
      text: 'Welcome!'
    }, false, (err, res) => {
      if(err) {
        console.log(`SendGrid Error : ${err}`)
      }  
    });
  }

});
