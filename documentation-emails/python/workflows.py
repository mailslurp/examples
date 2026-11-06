# <gen>emails_docs_setup
import base64
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


# <gen>emails_docs_send_html
def send_html(api_client, inbox_id, to):
    # send_email_and_confirm returns the sent email record once MailSlurp accepts it.
    return mailslurp_client.InboxControllerApi(api_client).send_email_and_confirm(
        inbox_id,
        mailslurp_client.SendEmailOptions(
            to=[to],
            subject="Your order has shipped",
            body='<h1>On its way</h1><p>Track it at <a href="https://example.com/track">example.com</a></p>',
            is_html=True,
        ),
    )
# </gen>


# <gen>emails_docs_send_attachment
def send_attachment(api_client, inbox_id, to):
    # Upload the file first, then send its attachment ID with the email.
    attachment_ids = mailslurp_client.AttachmentControllerApi(api_client).upload_attachment(
        mailslurp_client.UploadAttachmentOptions(
            base64_contents=base64.b64encode(b"id,total\n1001,49.00\n").decode(),
            content_type="text/csv",
            filename="invoice.csv",
        )
    )
    return mailslurp_client.InboxControllerApi(api_client).send_email_and_confirm(
        inbox_id,
        mailslurp_client.SendEmailOptions(
            to=[to], subject="Invoice attached", body="See attached.", attachments=attachment_ids
        ),
    )
# </gen>


# <gen>emails_docs_get_email
def get_email(api_client, email_id):
    email = mailslurp_client.EmailControllerApi(api_client).get_email(email_id)
    return {"from": email._from, "subject": email.subject, "body": email.body,
            "attachments": email.attachments}
# </gen>


# <gen>emails_docs_links_codes
def links_and_codes(api_client, email_id):
    # MailSlurp parses links and one-time codes from the email body for you.
    emails = mailslurp_client.EmailControllerApi(api_client)
    links = emails.get_email_links(email_id).links
    codes = emails.get_email_codes(email_id)
    return links, codes
# </gen>


# <gen>emails_docs_download_attachment
def download_attachment(api_client, email_id):
    email = mailslurp_client.EmailControllerApi(api_client).get_email(email_id)
    attachment_id = email.attachments[0]
    file = mailslurp_client.AttachmentControllerApi(api_client).download_attachment_as_base64_encoded(
        attachment_id
    )
    return file.content_type, base64.b64decode(file.base64_file_contents)
# </gen>


# <gen>emails_docs_reply
def reply(api_client, email_id):
    # Replies keep the original thread headers and send from the receiving inbox.
    return mailslurp_client.EmailControllerApi(api_client).reply_to_email(
        email_id, mailslurp_client.ReplyToEmailOptions(body="Thanks, received.", is_html=False)
    )
# </gen>
