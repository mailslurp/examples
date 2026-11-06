# <gen>placement_docs_setup
import os
import time
from collections import Counter, defaultdict

import mailslurp_client


def create_client():
    api_key = os.environ.get("MAILSLURP_API_KEY")
    if not api_key:
        raise RuntimeError("Set MAILSLURP_API_KEY")
    configuration = mailslurp_client.Configuration()
    configuration.api_key["x-api-key"] = api_key
    return mailslurp_client.ApiClient(configuration)
# </gen>


# <gen>placement_docs_create_test
def create_test(api_client, sender_domain, from_email):
    # A test gives you seed addresses at Gmail, Outlook, Yahoo and other providers.
    run = mailslurp_client.ApiInboxPlacementTestControllerApi(api_client).create_inbox_placement_test(
        mailslurp_client.CreateInboxPlacementTestOptions(
            requested_segment="ALL_INBOXES",
            sender_domain=sender_domain,
            from_email=from_email,
            public_share_requested=False,
            address_format="COMMA",
        )
    )
    # Keep the tracking token: the campaign you send must include it.
    return run.id, run.tracking_token, run.seed_addresses
# </gen>


# <gen>placement_docs_send_to_seeds
def send_to_seeds(api_client, sender_inbox_id, test_id, tracking_token, seed_addresses):
    # Send your real campaign to every seed address with the test's tracking token in the subject.
    # In production, send through your own ESP from the domain you are testing; a MailSlurp inbox
    # is used here to keep the example short.
    mailslurp_client.InboxControllerApi(api_client).send_email(
        sender_inbox_id,
        mailslurp_client.SendEmailOptions(
            to=seed_addresses,
            subject=f"Spring sale: 20% off everything {tracking_token}",
            body="<h1>Spring sale</h1><p>20% off everything this week.</p>",
            is_html=True,
        ),
    )
    # Confirm only after the send succeeded, so MailSlurp starts watching the seed inboxes.
    mailslurp_client.ApiInboxPlacementTestControllerApi(api_client).confirm_inbox_placement_test_sent(test_id)
# </gen>


# <gen>placement_docs_wait_results
def wait_for_results(api_client, test_id):
    # Seeds report as messages arrive; poll until the test completes (usually a few minutes).
    placement = mailslurp_client.ApiInboxPlacementTestControllerApi(api_client)
    for _ in range(40):
        run = placement.get_inbox_placement_test(test_id)
        if run.completed_at:
            return {"inbox": run.inbox_targets, "spam": run.spam_targets,
                    "missing": run.not_received_targets, "total": run.total_targets}
        time.sleep(15)
    raise TimeoutError(f"Inbox placement test {test_id} is still running")
# </gen>


# <gen>placement_docs_by_provider
def placement_by_provider(api_client, test_id):
    # Count where each provider put the email: INBOX, SPAM or not received.
    results = mailslurp_client.ApiInboxPlacementTestControllerApi(
        api_client
    ).get_inbox_placement_test_results(test_id).results
    by_provider = defaultdict(Counter)
    for target in (results.targets if results else []):
        by_provider[target.provider][target.placement_folder or "NOT_RECEIVED"] += 1
    return dict(by_provider)
# </gen>
