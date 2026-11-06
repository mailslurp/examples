//<gen>webhooks_docs_setup
import { MailSlurp, CreateWebhookOptionsEventNameEnum } from 'mailslurp-client';

export function createClient() {
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  return new MailSlurp({ apiKey });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId @param {string} url */
//<gen>webhooks_docs_create
export async function createWebhook(mailslurp, inboxId, url) {
  // MailSlurp POSTs a JSON payload to `url` each time this inbox receives an email.
  return mailslurp.webhookController.createWebhook({
    inboxId,
    createWebhookOptions: { url, name: 'New order emails', eventName: CreateWebhookOptionsEventNameEnum.NEW_EMAIL },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId */
//<gen>webhooks_docs_list
export async function listWebhooks(mailslurp, inboxId) {
  const page = await mailslurp.webhookController.getAllWebhooks({ inboxId, size: 20 });
  return page.content.map(webhook => ({ id: webhook.id, url: webhook.url, event: webhook.eventName, health: webhook.healthStatus }));
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} webhookId */
//<gen>webhooks_docs_test
export async function sendTest(mailslurp, webhookId) {
  // Sends a sample payload to your endpoint and returns the response it gave.
  const result = await mailslurp.webhookController.sendTestData({ webhookId });
  return { status: result.response.statusCode, message: result.message };
}
//</gen>

/** @param {MailSlurp} mailslurp @param {Record<string, string>} headers */
//<gen>webhooks_docs_verify
export async function verifySignature(mailslurp, headers) {
  // In your webhook handler, pass the x-message-id and x-signature request headers.
  const { isValid } = await mailslurp.webhookController.verifyWebhookSignature({
    verifyWebhookSignatureOptions: { messageId: headers['x-message-id'], signature: headers['x-signature'] },
  });
  return isValid;
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} webhookId */
//<gen>webhooks_docs_delete
export async function deleteWebhook(mailslurp, webhookId) {
  await mailslurp.webhookController.deleteWebhookById({ webhookId });
}
//</gen>
