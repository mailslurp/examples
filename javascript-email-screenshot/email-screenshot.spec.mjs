import {test, expect} from 'vitest'
import {writeFile} from 'fs/promises';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import Jimp from "jimp";

const __dirname = dirname(fileURLToPath(import.meta.url));
test('can take screenshot of an email', async () => {
    //<gen>email_screenshot_setup
    const MailSlurp = await import('mailslurp-client').then(m => m.default)
    const mailslurp = new MailSlurp({apiKey: process.env.API_KEY})
    //</gen>
    //<gen>email_screenshot_create_email
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
    //</gen>
    //<gen>email_screenshot_wait_screenshot
    // wait for email to arrive
    const email = await mailslurp.waitForLatestEmail(inbox.id, 120_000, true)
    // get a screenshot of the email
    const screenshot = await mailslurp.emailController.getEmailScreenshotAsBase64({
        emailId: email.id,
        getEmailScreenshotOptions: {
            height: 480,
            width: 320
        }
    })
    //</gen>
    //<gen>email_screenshot_load_image_buffer
    const imgBuffer = Buffer.from(screenshot.base64EncodedImage, 'base64')
    //</gen>
    //<gen>email_screenshot_diff
    const pathExpected = join(__dirname, 'email-screenshot.expected.png')
    const threshold = 0.2
    const diff = Jimp.diff(await Jimp.read(imgBuffer), await Jimp.read(pathExpected), threshold);
    expect(diff.percent).toBeLessThan(threshold)
    //</gen>
}, 120_000)