import {test, expect} from '@playwright/test';

declare module '@playwright/test' {
    interface TestInfo {
        inbox?: {
            id: string;
            emailAddress: string
        }
    }
}
const Pages = {
    magicLinkSignUp: "https://api.mailslurp.com/test-application/magic-link"
};
const TIMEOUT = 60_000
test.describe.configure({mode: 'serial'});

//<gen>playwright_simple_create_inbox
import {MailSlurp} from 'mailslurp-client';

const ms = new MailSlurp({apiKey: process.env.API_KEY});
test.beforeEach(async ({}, testInfo) => {
    // create a fresh inbox for each test
    const {id, emailAddress} = await ms.createInbox();
    testInfo.inbox = {id, emailAddress};
});
//</gen>

test.describe('email magic links test', () => {
    //<gen>playwright_simple_signup_magic_link
    test('sign up with email', async ({page}, {inbox}) => {
        // use email address to sign up
        await page.goto(Pages.magicLinkSignUp);
        await page.fill('#emailAddress', inbox.emailAddress);
        await page.click('[type="submit"]');
    });
    //</gen>
    //<gen>playwright_simple_signup_magic_receive_email
    test('receive confirmation link and click', async ({page}, {inbox}) => {
        // wait for confirmation email
        const {id, subject} = await ms.waitForLatestEmail(inbox.id, TIMEOUT)
        expect(subject).toMatch(/confirm your email/);
        // extract link and click it
        const {links} = await ms.emailController.getEmailLinks({ selector: '.confirm-btn', emailId: id })
        await page.goto(links[0]);
    });
    //</gen>
    test('can load dashboard', async ({page}) => {
        await page.waitForSelector('[data-el="dashboard-success"]')
    })
})

test.describe('email magic links test short', () => {
    //<gen>playwright_simple_signup_magic_link_short
    test('can receive confirmation link', async ({page}) => {
        const inbox = await ms.createInbox();
        // use new email address to sign up
        await page.goto(Pages.magicLinkSignUp);
        await page.fill('#emailAddress', inbox.emailAddress);
        await page.click('[type="submit"]');
        // wait for email magic link
        const email = await ms.waitForLatestEmail(inbox.id, TIMEOUT)
        // extract link and click it
        const query = await ms.emailController.getEmailLinks({
            selector: '.confirm-btn',
            emailId: email.id
        })
        await page.goto(query.links[0]);
    });
    //</gen>
})