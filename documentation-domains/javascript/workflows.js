//<gen>domains_docs_setup
import { MailSlurp } from 'mailslurp-client';

export function createClient() {
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  return new MailSlurp({ apiKey });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} domain */
//<gen>domains_docs_create
export async function addDomain(mailslurp, domain) {
  // Add a domain you control, for example test.example.com. Next, publish its DNS records.
  return mailslurp.domainController.createDomain({
    createDomainOptions: { domain, description: 'QA mail domain', createdCatchAllInbox: true },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} domainId */
//<gen>domains_docs_dns_records
export async function dnsRecords(mailslurp, domainId) {
  // Add each record at your DNS provider. Required records must exist before verification passes.
  const domain = await mailslurp.domainController.getDomain({ id: domainId });
  return domain.domainNameRecords.map(record => ({
    type: record.recordType, name: record.name, values: record.recordEntries, ttl: record.ttl, required: record.required,
  }));
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} domainId */
//<gen>domains_docs_check_verified
export async function checkVerified(mailslurp, domainId) {
  // Verification runs automatically after DNS propagates; read the status and any missing records.
  const domain = await mailslurp.domainController.getDomain({ id: domainId });
  return { verified: domain.isVerified, missing: domain.missingRecordsMessage };
}
//</gen>

/** @param {MailSlurp} mailslurp */
//<gen>domains_docs_list
export async function listDomains(mailslurp) {
  const domains = await mailslurp.domainController.getDomains({});
  return domains.map(domain => ({ id: domain.id, domain: domain.domain, verified: domain.isVerified }));
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} domain */
//<gen>domains_docs_create_inbox
export async function createInboxOnDomain(mailslurp, domain) {
  // Once verified, create addresses on the domain, such as support@your-domain.
  return mailslurp.createInboxWithOptions({ emailAddress: `support@${domain}`, name: 'Support tests' });
}
//</gen>
