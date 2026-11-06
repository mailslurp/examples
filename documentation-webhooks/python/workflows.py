# <gen>webhooks_docs_setup
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


# <gen>webhooks_docs_create
def create_webhook(api_client, inbox_id, url):
    # MailSlurp POSTs a JSON payload to `url` each time this inbox receives an email.
    return mailslurp_client.WebhookControllerApi(api_client).create_webhook(
        inbox_id,
        mailslurp_client.CreateWebhookOptions(url=url, name="New order emails", event_name="NEW_EMAIL"),
    )
# </gen>


# <gen>webhooks_docs_list
def list_webhooks(api_client, inbox_id):
    page = mailslurp_client.WebhookControllerApi(api_client).get_all_webhooks(inbox_id=inbox_id, size=20)
    return [(w.id, w.url, w.event_name, w.health_status) for w in page.content]
# </gen>


# <gen>webhooks_docs_test
def send_test(api_client, webhook_id):
    # Sends a sample payload to your endpoint and returns the response it gave.
    result = mailslurp_client.WebhookControllerApi(api_client).send_test_data(webhook_id)
    return result.response.status_code, result.message
# </gen>


# <gen>webhooks_docs_verify
def verify_signature(api_client, headers):
    # In your webhook handler, pass the x-message-id and x-signature request headers.
    result = mailslurp_client.WebhookControllerApi(api_client).verify_webhook_signature(
        mailslurp_client.VerifyWebhookSignatureOptions(
            message_id=headers["x-message-id"], signature=headers["x-signature"]
        )
    )
    return result.is_valid
# </gen>


# <gen>webhooks_docs_delete
def delete_webhook(api_client, webhook_id):
    mailslurp_client.WebhookControllerApi(api_client).delete_webhook_by_id(webhook_id)
# </gen>
