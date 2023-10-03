//<gen>react-email-test-imports
import { expect, test } from 'vitest'
import {sendEmail} from "../src/email-sender.js";
import {MailSlurp} from "mailslurp-client";
const API_KEY= process.env.API_KEY;
//</gen>

function generateRandomCode(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
//<gen>react-email-test
test('can send an email using react email and extract the expected code', async () => {
    expect(API_KEY).toBeDefined();
    const mailslurp = new MailSlurp({
        apiKey: API_KEY
    })
    const inbox = await mailslurp.createInboxWithOptions({
        // use smtp access for nodemailer
        inboxType: 'SMTP_INBOX',
        // ensure no real emails are sent, capture sends in sent mail
        virtualInbox: true,
    })
    const access = await mailslurp.inboxController.getImapSmtpAccess({
        inboxId: inbox.id
    })
    const code = generateRandomCode()
    await sendEmail(code, {
        sender: inbox.emailAddress,
        to: inbox.emailAddress,
        subject: 'Test email code',
    }, {
        host: access.secureSmtpServerHost,
        port: access.secureSmtpServerPort,
        user: access.secureSmtpUsername,
        pass: access.secureSmtpPassword
    })
    // get the sent email id
    const { content: [{ id: sentEmailId}]} = await mailslurp.sentController.getSentEmails({
        inboxId: inbox.id
    })
    // get the sent email from sent mail
    const sentEmail = await mailslurp.sentController.getSentEmail({id: sentEmailId})
    // expect email contains desired content
    expect(sentEmail.subject).toEqual('Test email code')
    expect(sentEmail.body).toContain('Your code is: ' + code)
})
//</gen>