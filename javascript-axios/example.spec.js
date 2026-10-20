/**
 * Example of how to create email addresses then send and receive emails
 * using Axios, NodeJs, and a MailSlurp free account.
 * See https://www.mailslurp.com/docs/
 */
const axios = require('axios');
const API_KEY = process.env.MAILSLURP_API_KEY || process.env.API_KEY;
const client = axios.create({ baseURL: 'https://api.mailslurp.com', headers: { 'x-api-key': API_KEY } });
jest.setTimeout(60_000);

describe("mailslurp axios example", () => {

  async function createInbox() {
    // make sure you have free API Key
    expect(API_KEY).toBeDefined();

    // call MailSlurp createInbox endpoint
    return await client
      .post(`/inboxes/withOptions`, { expiresIn: 300_000 })
      .then(res => res.data);
  }

  test("create an inbox", async () => {
    const inbox = await createInbox();
    // expect an inbox to have been created
    expect(inbox.id).toBeDefined()
    expect(inbox.emailAddress).toBeDefined()
    expect(inbox.emailAddress).toMatch(/^[^@\s]+@[^@\s]+$/)
  })

  test("can send a real email between two addresses", async () => {
    // create two inboxes
    const inbox1 = await createInbox();
    const inbox2 = await createInbox();

    // send email from inbox 1 to inbox 2
    // Use an owned MailSlurp recipient for this self-contained test.
    await client({
      method: 'post',
      url: `/inboxes/${inbox1.id}`,
      data: {
        to: [inbox2.emailAddress],
        subject: 'Hello inbox 2',
        body: 'Test from inbox 1'
      },
      json: true
    });

    // receive the email from inbox 2
    const email = await client
      .get('/waitForLatestEmail', { params: { inboxId: inbox2.id, timeout: 30_000, unreadOnly: true }, timeout: 35_000 })
      .then(res => res.data);
    expect(email.from).toEqual(inbox1.emailAddress);
    expect(email.subject).toEqual('Hello inbox 2');
    expect(email.body).toEqual('Test from inbox 1');
  })

})
