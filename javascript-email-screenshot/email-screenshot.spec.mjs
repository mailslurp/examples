import {test} from 'vitest'
import {writeFile} from 'fs/promises';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
test('can take screenshot of an email', async () => {
    const MailSlurp = await import('mailslurp-client').then(m => m.default)
    const mailslurp = new MailSlurp({apiKey: process.env.API_KEY})
    // create an inbox
    const inbox = await mailslurp.inboxController.createInboxWithOptions({
        createInboxDto: {
            expiresIn: 300_000
        }
    })
    // send email to inbox
    await mailslurp.sendEmail(inbox.id, {
        to: [inbox.emailAddress],
        subject: 'Welcome to my newsletter',
        body: 'Hello Jack. This email is a test.'
    })
    // wait for email to arrive
    const email = await mailslurp.waitForLatestEmail(inbox.id, 120_000, true)
    // take screenshot of the email
    const screenshot = await mailslurp.emailController.getEmailScreenshotAsBase64({
        emailId: email.id,
        getEmailScreenshotOptions: {
            height: 480,
            width: 320
        }
    })
    const img = Buffer.from(screenshot.base64EncodedImage, 'base64')
    const path = join(__dirname, 'email-screenshot.png')
    const pathExpected = join(__dirname, 'email-screenshot.expected.png')
    await writeFile(path, img)
    await writeFile(pathExpected, img)
    // var diff = Jimp.diff(image1, image2, threshold); // threshold ranges 0-1 (default: 0.1)

}, 120_000)