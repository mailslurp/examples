# <gen>domains_docs_setup
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


# <gen>domains_docs_create
def add_domain(api_client, domain):
    # Add a domain you control, for example test.example.com. Next, publish its DNS records.
    return mailslurp_client.DomainControllerApi(api_client).create_domain(
        mailslurp_client.CreateDomainOptions(
            domain=domain, description="QA mail domain", created_catch_all_inbox=True
        )
    )
# </gen>


# <gen>domains_docs_dns_records
def dns_records(api_client, domain_id):
    # Add each record at your DNS provider. Required records must exist before verification passes.
    domain = mailslurp_client.DomainControllerApi(api_client).get_domain(domain_id)
    return [
        (record.record_type, record.name, record.record_entries, record.ttl, record.required)
        for record in domain.domain_name_records
    ]
# </gen>


# <gen>domains_docs_check_verified
def check_verified(api_client, domain_id):
    # Verification runs automatically after DNS propagates; read the status and any missing records.
    domain = mailslurp_client.DomainControllerApi(api_client).get_domain(domain_id)
    return domain.is_verified, domain.missing_records_message
# </gen>


# <gen>domains_docs_list
def list_domains(api_client):
    domains = mailslurp_client.DomainControllerApi(api_client).get_domains()
    return [(domain.id, domain.domain, domain.is_verified) for domain in domains]
# </gen>


# <gen>domains_docs_create_inbox
def create_inbox_on_domain(api_client, domain):
    # Once verified, create addresses on the domain, such as support@your-domain.
    return mailslurp_client.InboxControllerApi(api_client).create_inbox_with_options(
        mailslurp_client.CreateInboxDto(email_address=f"support@{domain}", name="Support tests")
    )
# </gen>
