const MailSlurp = require("mailslurp-client").MailSlurp;
const fetchApi = require("isomorphic-fetch");
const fs = require('fs');

QUnit.module('send named attachments');

QUnit.test('can upload attachments with names and fetch information', async assert => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Please set API_KEY environment variable")
    }
    const attachmentPath = process.env.PATH_TO_ATTACHMENT;
    if (!attachmentPath) {
        throw new Error("Please set PATH_TO_ATTACHMENT")
    }
    const mailslurp = new MailSlurp({fetchApi, apiKey})

    const contents = fs.readFileSync(attachmentPath, {encoding: 'base64'});
    const filename = 'My-Data_with-specialName.csv';
    const [attachmentId] = await mailslurp.uploadAttachment({
        base64Contents: contents,
        contentType: 'text/csv',
        filename
    });
    assert.equal(!!attachmentId, true)

    const attachmentInfo = await mailslurp.attachmentController.getAttachmentInfo({attachmentId})
    assert.equal(attachmentInfo.name, filename);
    assert.equal(attachmentInfo.contentType, 'text/csv');
});