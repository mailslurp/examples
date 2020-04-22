/**
 * Example of how to create email addresses then send and receive emails
 * using Axios, NodeJs, and a MailSlurp free account.
 * See https://www.mailslurp.com/docs/
 */
const axios = require('axios');
const API_KEY = process.env.API_KEY;

describe("mailslurp axios example", () => {

  async function createInbox() {
    // make sure you have free API Key
    expect(API_KEY).toBeDefined();

    // call MailSlurp createInbox endpoint
    return await axios
      .post(`https://api.mailslurp.com/createInbox?apiKey=${API_KEY}`)
      .then(res => res.data);
  }

  test("create an inbox", async () => {
    const inbox = await createInbox();
    // expect an inbox to have been created
    expect(inbox.id).toBeDefined()
    expect(inbox.emailAddress).toBeDefined()
    expect(inbox.emailAddress).toMatch(/.+@mailslurp.com/)
  })

  test("can send a real email between two addresses", async () => {
    // create two inboxes
    const inbox1 = await createInbox();
    const inbox2 = await createInbox();

    // send email from inbox 1 to inbox 2
    // NOTE you can send emails to any address with MailSlurp
    await axios({
      method: 'post',
      url: `https://api.mailslurp.com/sendEmail?apiKey=${API_KEY}`,
      data: {
        senderId: inbox1.id,
        to: inbox2.emailAddress,
        subject: 'Hello inbox 2',
        body: 'Test from inbox 1'
      },
      json: true
    });

    // receive the email from inbox 2
    const email = await axios
      .get(`https://api.mailslurp.com/waitForLatestEmail?apiKey=${API_KEY}&inboxId=${inbox2.id}`)
      .then(res => res.data);
    expect(email.from).toEqual(inbox1.emailAddress);
    expect(email.subject).toEqual('Hello inbox 2');
    expect(email.body).toEqual('Test from inbox 1');
  })

})
