//<gen>inbox_docs_setup
import {
  MailSlurp,
  CreateWebhookOptionsEventNameEnum,
  GetAllInboxesSortEnum,
  GetInboxEmailsPaginatedSortEnum,
  MatchOptionFieldEnum,
  MatchOptionShouldEnum,
} from 'mailslurp-client';
import { ImapFlow } from 'imapflow';

export function createClient() {
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  return new MailSlurp({ apiKey });
}
//</gen>

/** @param {MailSlurp} mailslurp */
//<gen>inbox_docs_create_random
export async function createRandom(mailslurp) {
  return mailslurp.createInboxWithOptions({
    name: 'Signup tests', tags: ['signup', 'staging'],
  });
}
//</gen>

/** @param {MailSlurp} mailslurp */
//<gen>inbox_docs_create_pool
export async function createPool(mailslurp) {
  const available = await mailslurp.domainController.getAvailableDomains({});
  const poolDomains = available.domainGroups
    .filter(group => group.label === 'DOMAIN_POOL')
    .flatMap(group => group.domains);
  const inbox = await mailslurp.createInboxWithOptions({ useDomainPool: true });
  return { poolDomains, inbox };
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} verifiedAddress */
//<gen>inbox_docs_create_custom
export async function createCustom(mailslurp, verifiedAddress) {
  return mailslurp.createInboxWithOptions({
    emailAddress: verifiedAddress, name: 'Custom domain signup',
  });
}
//</gen>

/** @param {MailSlurp} mailslurp */
//<gen>inbox_docs_create_virtual
export async function createVirtual(mailslurp) {
  return mailslurp.createInboxWithOptions({
    name: 'Application mail capture', virtualInbox: true,
  });
}
//</gen>

/** @param {MailSlurp} mailslurp */
//<gen>inbox_docs_create_expiring
export async function createExpiring(mailslurp) {
  return mailslurp.createInboxWithOptions({
    name: 'One test run', expiresIn: 5 * 60_000,
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} domainId */
//<gen>inbox_docs_catch_all
export async function catchAll(mailslurp, domainId) {
  await mailslurp.domainController.addDomainWildcardCatchAll({ id: domainId });
  return mailslurp.domainController.getDomainWildcardCatchAllInbox({ id: domainId });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {import('mailslurp-client').InboxDto} inbox @param {string} label */
//<gen>inbox_docs_plus_address
export async function plusAddress(mailslurp, inbox, label) {
  const [localPart, domain] = inbox.emailAddress.split('@');
  const plus = await mailslurp.inboxController.getOrCreateInboxPlusAddress({
    inboxId: inbox.id, fullAddress: `${localPart}+${label}@${domain}`,
  });
  const emails = await mailslurp.inboxController.getInboxPlusAddressEmailsForPlusAddressId({
    inboxId: inbox.id, plusAddressId: plus.id, page: 0, size: 20,
  });
  return { plus, emails };
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId @param {string} recipient */
//<gen>inbox_docs_send
export async function send(mailslurp, inboxId, recipient) {
  return mailslurp.sendEmail(inboxId, {
    to: [recipient], subject: 'Welcome',
    body: '<p>Your account is ready.</p>', isHTML: true,
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} tag @param {number} page */
//<gen>inbox_docs_list_inboxes
export async function listInboxes(mailslurp, tag = 'signup', page = 0) {
  return mailslurp.inboxController.getAllInboxes({
    tag, page, size: 20, sort: GetAllInboxesSortEnum.DESC,
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId @param {number} page */
//<gen>inbox_docs_list_emails
export async function listEmails(mailslurp, inboxId, page = 0) {
  return mailslurp.inboxController.getInboxEmailsPaginated({
    inboxId, page, size: 20, sort: GetInboxEmailsPaginatedSortEnum.DESC,
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId */
//<gen>inbox_docs_get_inbox
export async function getInbox(mailslurp, inboxId) {
  return mailslurp.inboxController.getInbox({ inboxId });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} emailId */
//<gen>inbox_docs_get_email
export async function getEmail(mailslurp, emailId) {
  return mailslurp.emailController.getEmail({ emailId });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId */
//<gen>inbox_docs_delete_inbox
export async function deleteInbox(mailslurp, inboxId) {
  await mailslurp.inboxController.deleteInbox({ inboxId });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId @param {string} receiverUrl */
//<gen>inbox_docs_webhook
export async function webhook(mailslurp, inboxId, receiverUrl) {
  return mailslurp.webhookController.createWebhook({
    inboxId,
    createWebhookOptions: {
      url: receiverUrl, eventName: CreateWebhookOptionsEventNameEnum.EMAIL_RECEIVED,
    },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId */
//<gen>inbox_docs_access
export async function access(mailslurp, inboxId) {
  return mailslurp.inboxController.getImapSmtpAccess({ inboxId });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId @param {Date} since */
//<gen>inbox_docs_wait_latest
export async function waitLatest(mailslurp, inboxId, since) {
  return mailslurp.waitController.waitForLatestEmail({
    inboxId, timeout: 60_000, unreadOnly: true, since,
  }, { signal: AbortSignal.timeout(75_000) });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId @param {string} subjectFragment @param {string} recipient @param {Date} since */
//<gen>inbox_docs_wait_matching
export async function waitMatching(mailslurp, inboxId, subjectFragment, recipient, since) {
  return mailslurp.waitController.waitForMatchingFirstEmail({
    inboxId, timeout: 60_000, unreadOnly: true, since,
    matchOptions: { matches: [{
      field: MatchOptionFieldEnum.SUBJECT,
      should: MatchOptionShouldEnum.CONTAIN,
      value: subjectFragment,
    }, {
      field: MatchOptionFieldEnum.TO,
      should: MatchOptionShouldEnum.CONTAIN,
      value: recipient,
    }] },
  }, { signal: AbortSignal.timeout(75_000) });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} inboxId */
//<gen>inbox_docs_imap_tls
export async function imapTls(mailslurp, inboxId) {
  const details = await mailslurp.inboxController.getImapSmtpAccess({ inboxId });
  const imap = new ImapFlow({
    host: details.secureImapServerHost,
    port: details.secureImapServerPort,
    secure: true,
    auth: { user: details.secureImapUsername, pass: details.secureImapPassword },
    tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
    logger: false,
  });
  await imap.connect();
  try {
    const mailbox = await imap.mailboxOpen(details.imapMailbox, { readOnly: true });
    return mailbox.exists;
  } finally {
    await imap.logout();
  }
}
//</gen>
