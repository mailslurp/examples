const MailSlurp = require("mailslurp-client").MailSlurp;
const fetchApi = require("isomorphic-fetch");
const nodemailer = require("nodemailer");

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
describe("get imap access", function () {
    it("call with inbox", async function () {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("Please set API_KEY environment variable")
        }
        const mailslurp = new MailSlurp({apiKey, fetchApi})
        const {id: inboxId} = await mailslurp.createInboxWithOptions({
            expiresIn: 300_000,
            inboxType: 'SMTP_INBOX'
        });
        //<gen>node_get_imap_access
        const {
            secureSmtpServerHost,
            secureSmtpServerPort,
            secureSmtpUsername,
            secureSmtpPassword,
            smtpServerHost,
            smtpServerPort,
            smtpUsername,
            smtpPassword,
            secureImapServerHost,
            secureImapServerPort,
            secureImapUsername,
            secureImapPassword,
            imapServerHost,
            imapServerPort,
            imapUsername,
            imapPassword,
            mailFromDomain,
        } = await mailslurp.inboxController.getImapSmtpAccess({
            inboxId // optional inbox scope
        });
        //</gen>
        expect(secureSmtpServerHost).toBeDefined();
        expect(secureSmtpServerPort).toBeDefined();
        expect(secureSmtpUsername).toBeDefined();
        expect(secureSmtpPassword).toBeDefined();
        expect(smtpServerHost).toBeDefined();
        expect(smtpServerPort).toBeDefined();
        expect(smtpUsername).toBeDefined();
        expect(smtpPassword).toBeDefined();
        expect(secureImapServerHost).toBeDefined();
        expect(secureImapServerPort).toBeDefined();
        expect(secureImapUsername).toBeDefined();
        expect(secureImapPassword).toBeDefined();
        expect(imapServerHost).toBeDefined();
        expect(imapServerPort).toBeDefined();
        expect(imapUsername).toBeDefined();
        expect(imapPassword).toBeDefined();
        expect(mailFromDomain).toBeDefined();
    })
})
//<gen>nodemailer_full_send
describe("testing smtp", function () {
    it("can create an mailbox and get email preview urls", async function () {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("Please set API_KEY environment variable")
        }
        const mailslurp = new MailSlurp({apiKey, fetchApi})
        const access = await mailslurp.getImapSmtpAccessDetails();
        expect(access).toBeTruthy();

        const inbox1 = await mailslurp.createInboxWithOptions({inboxType: 'SMTP_INBOX'})
        const inbox2 = await mailslurp.createInboxWithOptions({inboxType: 'SMTP_INBOX'})

        const transporter = nodemailer.createTransport({
            host: access.smtpServerHost,
            port: access.smtpServerPort,
            secure: false,
            auth: {
                user: access.smtpUsername,
                pass: access.smtpPassword
            },
        });

        const sent = await transporter.sendMail({
            from: inbox1.emailAddress,
            to: inbox2.emailAddress,
            subject: "From inbox 1 to inbox 2",
            text: "Hi there",
            attachments: [
                {
                    filename: "example.txt",
                    content: new Buffer('hello world!', 'utf-8')
                }
            ],
        });
        expect(sent).toBeTruthy()

        const email = await mailslurp.waitForLatestEmail(inbox2.id, 30_000, true);
        expect(email.subject).toEqual("From inbox 1 to inbox 2")
        expect(email.attachments.length).toEqual(1)
        const accessUrls = await mailslurp.emailController.getEmailPreviewURLs({emailId: email.id})

        // access these urls in browser to view email content
        expect(accessUrls.plainHtmlBodyUrl).toContain("https://api.mailslurp.com")
        expect(accessUrls.rawSmtpMessageUrl).toContain("https://api.mailslurp.com")
    });
});
//</gen>
