import {test, expect } from "bun:test";

//<gen>bun_import_nodemailer
import nodemailer from "nodemailer";
//</gen>
//<gen>bun_import_mailslurp
import {MailSlurp} from "mailslurp-client";
//</gen>

test("send email", async () => {
    // configure mailslurp test inbox
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Please set API_KEY environment variable")
    }
    //<gen>bun_create_mailserver
    const mailslurp = new MailSlurp({apiKey})
    const {
        smtpServerHost, smtpServerPort,
        smtpUsername, smtpPassword
    } = await mailslurp.getImapSmtpAccessDetails();
    //</gen>

    // create inboxes to send and receive with
    const inbox1 = await mailslurp.createInboxWithOptions({inboxType: 'SMTP_INBOX'})
    const inbox2 = await mailslurp.createInboxWithOptions({inboxType: 'SMTP_INBOX'})

    //<gen>bun_nodemailer_setup
    const transporter = nodemailer.createTransport({
        host: smtpServerHost,
        port: smtpServerPort,
        secure: false,
        auth: {
            user: smtpUsername,
            pass: smtpPassword
        },
    });
    //</gen>
    //<gen>bun_send_email
    const sent = await transporter.sendMail({
        from: inbox1.emailAddress,
        to: inbox2.emailAddress,
        subject: "Test email",
        text: "Hello world!",
    });
    //</gen>
    expect(sent).toBeTruthy()
    //<gen>bun_read_email
    const email = await mailslurp.waitForLatestEmail(inbox2.id, 30_000, true);
    expect(email.subject).toContain("Test email")
    expect(email.body).toContain("Hello world!")
    //</gen>
});
