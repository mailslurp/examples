# <gen>inbox_docs_setup
import imaplib
import os
import ssl

import mailslurp_client


def create_client():
    api_key = os.environ.get("MAILSLURP_API_KEY")
    if not api_key:
        raise RuntimeError("Set MAILSLURP_API_KEY")
    configuration = mailslurp_client.Configuration()
    configuration.api_key["x-api-key"] = api_key
    return mailslurp_client.ApiClient(configuration)
# </gen>


# <gen>inbox_docs_create_random
def create_random(api_client):
    return mailslurp_client.InboxControllerApi(api_client).create_inbox_with_options(
        mailslurp_client.CreateInboxDto(name="Signup tests", tags=["signup", "staging"])
    )
# </gen>


# <gen>inbox_docs_create_pool
def create_pool(api_client):
    available = mailslurp_client.DomainControllerApi(api_client).get_available_domains()
    pool_domains = [
        domain for group in available.domain_groups if group.label == "DOMAIN_POOL"
        for domain in group.domains
    ]
    inbox = mailslurp_client.InboxControllerApi(api_client).create_inbox_with_options(
        mailslurp_client.CreateInboxDto(use_domain_pool=True)
    )
    return pool_domains, inbox
# </gen>


# <gen>inbox_docs_create_custom
def create_custom(api_client, verified_address):
    return mailslurp_client.InboxControllerApi(api_client).create_inbox_with_options(
        mailslurp_client.CreateInboxDto(
            email_address=verified_address, name="Custom domain signup"
        )
    )
# </gen>


# <gen>inbox_docs_create_virtual
def create_virtual(api_client):
    return mailslurp_client.InboxControllerApi(api_client).create_inbox_with_options(
        mailslurp_client.CreateInboxDto(
            name="Application mail capture", virtual_inbox=True
        )
    )
# </gen>


# <gen>inbox_docs_create_expiring
def create_expiring(api_client):
    return mailslurp_client.InboxControllerApi(api_client).create_inbox_with_options(
        mailslurp_client.CreateInboxDto(name="One test run", expires_in=5 * 60_000)
    )
# </gen>


# <gen>inbox_docs_catch_all
def catch_all(api_client, domain_id):
    domains = mailslurp_client.DomainControllerApi(api_client)
    domains.add_domain_wildcard_catch_all(id=domain_id)
    return domains.get_domain_wildcard_catch_all_inbox(id=domain_id)
# </gen>


# <gen>inbox_docs_plus_address
def plus_address(api_client, inbox, label):
    inboxes = mailslurp_client.InboxControllerApi(api_client)
    local_part, domain = inbox.email_address.split("@", 1)
    plus = inboxes.get_or_create_inbox_plus_address(
        inbox_id=inbox.id, full_address=f"{local_part}+{label}@{domain}"
    )
    emails = inboxes.get_inbox_plus_address_emails_for_plus_address_id(
        inbox_id=inbox.id, plus_address_id=plus.id, page=0, size=20
    )
    return plus, emails
# </gen>


# <gen>inbox_docs_send
def send(api_client, inbox_id, recipient):
    return mailslurp_client.InboxControllerApi(api_client).send_email_and_confirm(
        inbox_id=inbox_id,
        send_email_options=mailslurp_client.SendEmailOptions(
            to=[recipient], subject="Welcome",
            body="<p>Your account is ready.</p>", is_html=True,
        ),
    )
# </gen>


# <gen>inbox_docs_list_inboxes
def list_inboxes(api_client, tag="signup", page=0):
    return mailslurp_client.InboxControllerApi(api_client).get_all_inboxes(
        tag=tag, page=page, size=20, sort="DESC"
    )
# </gen>


# <gen>inbox_docs_list_emails
def list_emails(api_client, inbox_id, page=0):
    return mailslurp_client.InboxControllerApi(api_client).get_inbox_emails_paginated(
        inbox_id=inbox_id, page=page, size=20, sort="DESC"
    )
# </gen>


# <gen>inbox_docs_get_inbox
def get_inbox(api_client, inbox_id):
    return mailslurp_client.InboxControllerApi(api_client).get_inbox(inbox_id=inbox_id)
# </gen>


# <gen>inbox_docs_get_email
def get_email(api_client, email_id):
    return mailslurp_client.EmailControllerApi(api_client).get_email(email_id=email_id)
# </gen>


# <gen>inbox_docs_delete_inbox
def delete_inbox(api_client, inbox_id):
    mailslurp_client.InboxControllerApi(api_client).delete_inbox(inbox_id=inbox_id)
# </gen>


# <gen>inbox_docs_webhook
def webhook(api_client, inbox_id, receiver_url):
    return mailslurp_client.WebhookControllerApi(api_client).create_webhook(
        inbox_id=inbox_id,
        create_webhook_options=mailslurp_client.CreateWebhookOptions(
            url=receiver_url, event_name="EMAIL_RECEIVED"
        ),
    )
# </gen>


# <gen>inbox_docs_access
def access(api_client, inbox_id):
    return mailslurp_client.InboxControllerApi(api_client).get_imap_smtp_access(
        inbox_id=inbox_id
    )
# </gen>


# <gen>inbox_docs_wait_latest
def wait_latest(api_client, inbox_id, since):
    return mailslurp_client.WaitForControllerApi(api_client).wait_for_latest_email(
        inbox_id=inbox_id, timeout=60_000, unread_only=True, since=since, _request_timeout=(10, 75)
    )
# </gen>


# <gen>inbox_docs_wait_matching
def wait_matching(api_client, inbox_id, subject_fragment, recipient, since):
    return mailslurp_client.WaitForControllerApi(api_client).wait_for_matching_first_email(
        inbox_id=inbox_id, timeout=60_000, unread_only=True, since=since, _request_timeout=(10, 75),
        match_options=mailslurp_client.MatchOptions(matches=[
            mailslurp_client.MatchOption(field="SUBJECT", should="CONTAIN", value=subject_fragment),
            mailslurp_client.MatchOption(field="TO", should="CONTAIN", value=recipient)
        ]),
    )
# </gen>


# <gen>inbox_docs_imap_tls
def imap_tls(api_client, inbox_id):
    details = mailslurp_client.InboxControllerApi(api_client).get_imap_smtp_access(
        inbox_id=inbox_id
    )
    with imaplib.IMAP4_SSL(
        details.secure_imap_server_host,
        details.secure_imap_server_port,
        ssl_context=ssl.create_default_context(),
        timeout=30,
    ) as imap:
        imap.login(details.secure_imap_username, details.secure_imap_password)
        status, messages = imap.select(details.imap_mailbox, readonly=True)
        if status != "OK":
            raise RuntimeError("Could not select the inbox mailbox")
        return int(messages[0])
# </gen>
