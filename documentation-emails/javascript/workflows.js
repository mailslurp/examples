//<gen>emails_docs_setup
import { MailSlurp } from 'mailslurp-client';

export function createClient() {
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  return new MailSlurp({ apiKey });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId @param {string} to */
//<gen>emails_docs_send_html
export async function sendHtml(mailslurp, inboxId, to) {
  // sendEmailAndConfirm returns the sent email record once MailSlurp accepts it.
  return mailslurp.inboxController.sendEmailAndConfirm({
    inboxId,
    sendEmailOptions: {
      to: [to],
      subject: 'Your order has shipped',
      body: '<h1>On its way</h1><p>Track it at <a href="https://example.com/track">example.com</a></p>',
      isHTML: true,
    },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId @param {string} to */
//<gen>emails_docs_send_attachment
export async function sendAttachment(mailslurp, inboxId, to) {
  // Upload the file first, then send its attachment ID with the email.
  const [attachmentId] = await mailslurp.attachmentController.uploadAttachment({
    uploadAttachmentOptions: {
      base64Contents: Buffer.from('id,total\n1001,49.00\n').toString('base64'),
      contentType: 'text/csv',
      filename: 'invoice.csv',
    },
  });
  return mailslurp.inboxController.sendEmailAndConfirm({
    inboxId,
    sendEmailOptions: { to: [to], subject: 'Invoice attached', body: 'See attached.', attachments: [attachmentId] },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} emailId */
//<gen>emails_docs_get_email
export async function getEmail(mailslurp, emailId) {
  const email = await mailslurp.emailController.getEmail({ emailId });
  return { from: email.from, subject: email.subject, body: email.body, attachments: email.attachments };
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} emailId */
//<gen>emails_docs_links_codes
export async function linksAndCodes(mailslurp, emailId) {
  // MailSlurp parses links and one-time codes from the email body for you.
  const { links } = await mailslurp.emailController.getEmailLinks({ emailId });
  const codes = await mailslurp.emailController.getEmailCodes({ emailId });
  return { links, codes };
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} emailId */
//<gen>emails_docs_download_attachment
export async function downloadAttachment(mailslurp, emailId) {
  const email = await mailslurp.emailController.getEmail({ emailId });
  const attachmentId = email.attachments[0];
  const file = await mailslurp.attachmentController.downloadAttachmentAsBase64Encoded({ attachmentId });
  return { contentType: file.contentType, bytes: Buffer.from(file.base64FileContents, 'base64') };
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} emailId */
//<gen>emails_docs_reply
export async function reply(mailslurp, emailId) {
  // Replies keep the original thread headers and send from the receiving inbox.
  return mailslurp.emailController.replyToEmail({
    emailId,
    replyToEmailOptions: { body: 'Thanks, received.', isHTML: false },
  });
}
//</gen>
