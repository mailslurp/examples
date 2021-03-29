import mailslurp_client
import re

# define a library to use mailslurp functions in robot test
class MailSlurp(object):
    ROBOT_LIBRARY_VERSION = '1.0.0'
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'

    # configure the mailslurp client using your API KEY
    def __init__(self, api_key):
        self.configuration = mailslurp_client.Configuration()
        self.configuration.api_key['x-api-key'] = api_key

    # function for creating an email address returns an inbox with an id and email_address
    def create_inbox(self):
        with mailslurp_client.ApiClient(self.configuration) as api_client:
            # create an inbox using the inbox controller
            api_instance = mailslurp_client.InboxControllerApi(api_client)
            inbox = api_instance.create_inbox()
            return inbox

    def wait_for_latest_email(self, inbox_id):
        with mailslurp_client.ApiClient(self.configuration) as api_client:
            # create an inbox using the inbox controller
            api_instance = mailslurp_client.WaitForControllerApi(api_client)
            email = api_instance.wait_for_latest_email(inbox_id=inbox_id, timeout=60000, unread_only=True)
            return email

    def extract_email_content(self, email_body):
        regex = 'Your Demo verification code is ([0-9]{6})'
        pattern = re.compile(regex)
        matches = pattern.match(email_body)
        content = matches.group(1)
        return content
