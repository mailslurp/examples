import {expect, test} from 'vitest'
import {MatchOptionFieldEnum, MatchOptionShouldEnum} from "mailslurp-client";

const YOUR_API_KEY = process.env.API_KEY;

test('can wait for email', async () => {
    expect(YOUR_API_KEY).toBeDefined()
    //<gen>wait_for_methods_client
    const {MailSlurp} = await import("mailslurp-client");
    const mailslurp = new MailSlurp({
        apiKey: YOUR_API_KEY
    });
    const inbox = await mailslurp.createInboxWithOptions({
        // expires in 5 minutes
        expiresIn: 300_000
    });
    expect(inbox.emailAddress).toContain("@mailslurp");
    //</gen>
    //<gen>wait_for_methods_test_wait_for_latest
    // send an email
    await mailslurp.inboxController.sendEmailAndConfirm({
        inboxId: inbox.id,
        sendEmailOptions: {
            to: [inbox.emailAddress],
            subject: "First email",
        }
    })
    // wait for the first unread email to arrive
    const email = await mailslurp.waitController.waitForLatestEmail({
        timeout: 120_000,
        inboxId: inbox.id,
        unreadOnly: true
    })
    expect(email.subject).toContain('First email')
    //</gen>
    //<gen>wait_for_methods_test_wait_for_matching
    // send two emails
    for (const i of [1, 2]) {
        await mailslurp.inboxController.sendEmailAndConfirm({
            inboxId: inbox.id,
            sendEmailOptions: {
                to: [inbox.emailAddress],
                // send a different message each time
                subject: `Match subject test-${i}`,
            }
        })
    }
    // wait for 2 emails matching the subject with a pattern
    const emails = await mailslurp.waitController.waitForMatchingEmails({
        inboxId: inbox.id,
        timeout: 120_000,
        unreadOnly: true,
        count: 2,
        matchOptions: {
            matches: [
                {
                    // expect subject to contain "Match subject"
                    value: "Match subject",
                    field: MatchOptionFieldEnum.SUBJECT,
                    should: MatchOptionShouldEnum.CONTAIN
                }
            ]
        }
    })
    // assert we received two emails matching the subject
    expect(emails.length).toEqual(2)
    // the subjects contain the test number from the loop
    expect(emails.filter(it => it.subject.includes("Match subject test-1")).length).toEqual(1)
    //</gen>
    //<gen>wait_for_methods_test_wait_nth
    const emailCount = await mailslurp.inboxController.getInboxEmailCount({inboxId: inbox.id})
    const indexOfEmail0Based = emailCount.totalElements
    await mailslurp.sendEmail(inbox.id, {
        to: [inbox.emailAddress],
        subject: "Next email"
    })
    const nthEmail = await mailslurp.waitController.waitForNthEmail({
        inboxId: inbox.id,
        index: indexOfEmail0Based
    })
    expect(nthEmail.subject).toContain('Next email');
    //</gen>
}, 120_000);