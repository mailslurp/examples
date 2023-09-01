/**
 * Set env variables before start for tests
 */
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("Must provide API_KEY for MailSlurp prestart.js")
}
// create mailslurp instance
const Mailslurp = require('mailslurp-client').default;
const fs = require("fs");
const mailslurp = new Mailslurp({ apiKey: API_KEY })

mailslurp.createInboxWithOptions({ inboxType: 'SMTP_INBOX' }).then((inbox)=> {
    return mailslurp.getImapSmtpAccessDetails(inbox.id).then(access => {
        const content = `# from prestart.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=63e3a8eb680c38655f67b07422563daf5231240fcb1c4de3a8c2aef4dec506cb
EMAIL_SERVER_HOST=${access.secureSmtpServerHost}
EMAIL_SERVER_PORT=${access.secureSmtpServerPort}
EMAIL_SERVER_USER=${access.secureSmtpUsername}
EMAIL_SERVER_PASSWORD=${access.secureSmtpPassword}
EMAIL_FROM=${inbox.emailAddress}
`
// write .env file
        fs.writeFileSync(__dirname + '/.env.local', content, { encoding: 'utf-8' })
    })
}).catch(err => { throw err })
