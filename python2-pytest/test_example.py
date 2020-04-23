# see https://github.com/mailslurp/mailslurp-client-python
import os
import re
import mailslurp_client

configuration = mailslurp_client.Configuration()
configuration.api_key['x-api-key'] = os.environ['API_KEY']

def test_can_create_email_address():
    with mailslurp_client.ApiClient(configuration) as api_client:
        # create an inbox using the inbox controller
        api_instance = mailslurp_client.InboxControllerApi(api_client)
        inbox = api_instance.create_inbox()

        # check the id and email_address of the inbox
        assert len(inbox.id) > 0
        assert "mailslurp.com" in inbox.email_address

def test_can_send_email():
    with mailslurp_client.ApiClient(configuration) as api_client:
        # first create an inbox
        api_instance = mailslurp_client.InboxControllerApi(api_client)
        inbox = api_instance.create_inbox()

        # send email from the inbox
        send_email_options = mailslurp_client.SendEmailOptions()
        send_email_options.to = [inbox.email_address]
        send_email_options.subject = "Hello"
        send_email_options.body = """
        <h1>MailSlurp supports HTML</h1>
        """
        send_email_options.is_html = True
        api_instance.send_email(inbox.id, send_email_options=send_email_options)

def test_can_receive_emails_and_extract_content():
    with mailslurp_client.ApiClient(configuration) as api_client:
        # create two inboxes for testing
        inbox_controller = mailslurp_client.InboxControllerApi(api_client)
        inbox_1 = inbox_controller.create_inbox()
        inbox_2 = inbox_controller.create_inbox()

        # send email from inbox 1 to inbox 2
        send_email_options = mailslurp_client.SendEmailOptions()
        send_email_options.to = [inbox_2.email_address]
        send_email_options.subject = "Hello inbox 2"
        send_email_options.body = "Your code is: 123"
        inbox_controller.send_email(inbox_1.id, send_email_options=send_email_options)

        # receive email for inbox 2
        waitfor_controller = mailslurp_client.WaitForControllerApi(api_client)
        email = waitfor_controller.wait_for_latest_email(inbox_id=inbox_2.id, timeout=30000, unread_only=True)

        assert email.subject == "Hello inbox 2"

        # extract content from body
        pattern = re.compile('Your code is: ([0-9]{3})')
        matches = pattern.match(email.body)
        code = matches.group(1)

        assert code == "123"



