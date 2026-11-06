//<gen>phones_docs_setup
import { MailSlurp } from 'mailslurp-client';

export function createClient() {
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  return new MailSlurp({ apiKey });
}
//</gen>

/** @param {MailSlurp} mailslurp */
//<gen>phones_docs_list_numbers
export async function listNumbers(mailslurp) {
  // Phone numbers are created in the dashboard or API; list them to find the one for your test.
  const page = await mailslurp.phoneController.getPhoneNumbers({ size: 20 });
  return page.content.map(phone => ({ id: phone.id, phoneNumber: phone.phoneNumber, country: phone.phoneCountry }));
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} phoneNumberId @param {Date} since */
//<gen>phones_docs_wait_latest
export async function waitForSms(mailslurp, phoneNumberId, since) {
  // Waits until an unread SMS arrives after `since`, or throws after the timeout.
  return mailslurp.waitController.waitForLatestSms({
    waitForSingleSmsOptions: { phoneNumberId, timeout: 60_000, unreadOnly: true, since },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} smsId */
//<gen>phones_docs_extract_code
export async function extractCode(mailslurp, smsId) {
  // MailSlurp finds the one-time code in the message body.
  const result = await mailslurp.smsController.getSmsCodes({ smsId });
  if (!result.found) throw new Error('No code found in the SMS');
  return result.code;
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} fromPhoneId @param {string} to */
//<gen>phones_docs_send_sms
export async function sendSms(mailslurp, fromPhoneId, to) {
  // `to` is an E.164 number, for example +15555550100.
  return mailslurp.smsController.sendSms({
    fromPhoneId,
    smsSendOptions: { to, body: 'Your appointment is confirmed for 3pm.' },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} phoneNumberId */
//<gen>phones_docs_list_sms
export async function listSms(mailslurp, phoneNumberId) {
  const page = await mailslurp.smsController.getAllSmsMessages({ phoneNumber: phoneNumberId, size: 20 });
  return page.content.map(sms => ({ id: sms.id, from: sms.fromNumber, body: sms.body, createdAt: sms.createdAt }));
}
//</gen>
