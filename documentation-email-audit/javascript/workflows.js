//<gen>audit_docs_setup
import { Configuration, EmailAuditControllerApi } from 'mailslurp-client';

export function createAuditClient() {
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  return new EmailAuditControllerApi(new Configuration({ apiKey }));
}
//</gen>

/** @param {EmailAuditControllerApi} audits @param {string} html */
//<gen>audit_docs_audit_html
export async function auditHtml(audits, html) {
  // Checks links, images, spelling and content before you send the campaign.
  const audit = await audits.createEmailAudit({
    createEmailAuditOptions: { subject: 'Spring sale: 20% off', fromAddress: 'news@example.com', htmlBody: html },
  });
  const { status, healthScore, passingChecks, failingChecks } = audit.analysis;
  return { auditId: audit.id, status, healthScore, passingChecks, failingChecks };
}
//</gen>

/** @param {EmailAuditControllerApi} audits @param {string} auditId */
//<gen>audit_docs_read_issues
export async function readIssues(audits, auditId) {
  const { analysis } = await audits.getEmailAudit({ auditId });
  return {
    brokenLinks: analysis.brokenLinks.map(issue => issue.url),
    brokenImages: analysis.brokenImages.map(issue => issue.url),
    contentIssues: (analysis.contentReview ?? [])
      .filter(check => check.status !== 'PASS')
      .map(check => `${check.title}: ${check.recommendation}`),
  };
}
//</gen>

/** @param {EmailAuditControllerApi} audits */
//<gen>audit_docs_list
export async function listAudits(audits) {
  const recent = await audits.getEmailAudits({ limit: 10 });
  return recent.map(audit => ({ id: audit.id, subject: audit.subject, score: audit.analysis.healthScore }));
}
//</gen>
