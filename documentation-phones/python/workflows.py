# <gen>phones_docs_setup
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


# <gen>phones_docs_list_numbers
def list_numbers(api_client):
    # Phone numbers are created in the dashboard or API; list them to find the one for your test.
    page = mailslurp_client.PhoneControllerApi(api_client).get_phone_numbers(size=20)
    return [(phone.id, phone.phone_number, phone.phone_country) for phone in page.content]
# </gen>


# <gen>phones_docs_wait_latest
def wait_for_sms(api_client, phone_number_id, since):
    # Waits until an unread SMS arrives after `since`, or raises after the timeout.
    return mailslurp_client.WaitForControllerApi(api_client).wait_for_latest_sms(
        mailslurp_client.WaitForSingleSmsOptions(
            phone_number_id=phone_number_id, timeout=60_000, unread_only=True, since=since
        )
    )
# </gen>


# <gen>phones_docs_extract_code
def extract_code(api_client, sms_id):
    # MailSlurp finds the one-time code in the message body.
    result = mailslurp_client.SmsControllerApi(api_client).get_sms_codes(sms_id)
    if not result.found:
        raise ValueError("No code found in the SMS")
    return result.code
# </gen>


# <gen>phones_docs_send_sms
def send_sms(api_client, from_phone_id, to):
    # `to` is an E.164 number, for example +15555550100.
    return mailslurp_client.SmsControllerApi(api_client).send_sms(
        mailslurp_client.SmsSendOptions(to=to, body="Your appointment is confirmed for 3pm."),
        from_phone_id=from_phone_id,
    )
# </gen>


# <gen>phones_docs_list_sms
def list_sms(api_client, phone_number_id):
    page = mailslurp_client.SmsControllerApi(api_client).get_all_sms_messages(
        phone_number=phone_number_id, size=20
    )
    return [(sms.id, sms.from_number, sms.body, sms.created_at) for sms in page.content]
# </gen>
