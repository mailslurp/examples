# <gen>audit_docs_setup
import os

import mailslurp_client


def create_client():
    api_key = os.environ.get("MAILSLURP_API_KEY")
    if not api_key:
        raise RuntimeError("Set MAILSLURP_API_KEY")
    configuration = mailslurp_client.Configuration()
    configuration.api_key["x-api-key"] = api_key
    return mailslurp_client.ApiClient(configuration)
# </gen>


# <gen>audit_docs_audit_html
def audit_html(api_client, html):
    # Checks links, images, spelling and content before you send the campaign.
    audit = mailslurp_client.EmailAuditControllerApi(api_client).create_email_audit(
        mailslurp_client.CreateEmailAuditOptions(
            subject="Spring sale: 20% off", from_address="news@example.com", html_body=html
        )
    )
    analysis = audit.analysis
    return audit.id, analysis.status, analysis.health_score, analysis.failing_checks
# </gen>


# <gen>audit_docs_read_issues
def read_issues(api_client, audit_id):
    analysis = mailslurp_client.EmailAuditControllerApi(api_client).get_email_audit(audit_id).analysis
    return {
        "broken_links": [issue.url for issue in analysis.broken_links],
        "broken_images": [issue.url for issue in analysis.broken_images],
        "content_issues": [
            f"{check.title}: {check.recommendation}"
            for check in (analysis.content_review or [])
            if check.status != "PASS"
        ],
    }
# </gen>


# <gen>audit_docs_list
def list_audits(api_client):
    audits = mailslurp_client.EmailAuditControllerApi(api_client).get_email_audits(limit=10)
    return [(audit.id, audit.subject, audit.analysis.health_score) for audit in audits]
# </gen>
