const MailSlurp = require("mailslurp-client").MailSlurp;
const fetchApi = require("isomorphic-fetch");
const fs = require('fs');

QUnit.module('send named attachments');
QUnit.config.testTimeout = 120000;

QUnit.test('can upload attachments with names and fetch information', async assert => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Please set API_KEY environment variable")
    }
    const attachmentPath = process.env.PATH_TO_ATTACHMENT;
    if (!attachmentPath) {
        throw new Error("Please set PATH_TO_ATTACHMENT")
    }
    // create mailslurp instance
    const mailslurp = new MailSlurp({fetchApi, apiKey})

    // create an attachment using base64 file encoding
    const contents = fs.readFileSync(attachmentPath, {encoding: 'base64'});
    const filename = 'My-Data_with-specialName.csv';
    const [attachmentId] = await mailslurp.uploadAttachment({
        base64Contents: contents,
        contentType: 'text/csv',
        filename
    });
    assert.equal(!!attachmentId, true)

    // check attachment info
    const attachmentInfo = await mailslurp.attachmentController.getAttachmentInfo({attachmentId})
    assert.equal(attachmentInfo.name, filename);
    assert.equal(attachmentInfo.contentType, 'text/csv');

    // create an inbox and send attachment to it from self
    const inbox = await mailslurp.inboxController.createInbox({})
    const sent = await mailslurp.sendEmail(inbox.id, {attachments:[attachmentId], body: "test body", subject: "test subject", to:[inbox.emailAddress]})
    assert.equal(sent.attachments.length, 1)

    // check sent attachment info
    const sentAttachmentInfo = await mailslurp.attachmentController.getAttachmentInfo({attachmentId: sent.attachments[0] })
    assert.equal(sentAttachmentInfo.name, filename);
    assert.equal(sentAttachmentInfo.contentType, 'text/csv');

    // wait for email to arrive
    const email = await mailslurp.waitForNthEmail(inbox.id, 0, 30000);
    assert.equal(email.subject, "test subject")
    assert.equal(email.attachments.length, 1)

    // get attachment
    const receivedAttachment = email.attachments[0];
    const receivedAttachmentInfo = await mailslurp.attachmentController.getAttachment({ attachmentId: receivedAttachment })

    // assert name is preserved
    assert.equal(receivedAttachmentInfo.name, filename)
});