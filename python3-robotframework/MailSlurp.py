__version__ = '1.0.0'
import mailslurp_client

class MailSlurp(object):
    ROBOT_LIBRARY_VERSION = __version__
    ROBOT_LIBRARY_SCOPE = 'GLOBAL'

    def __init__(self, api_key):
        self.configuration = mailslurp_client.Configuration()
        self.configuration.api_key['x-api-key'] = api_key

    def create_inbox(self):
        with mailslurp_client.ApiClient(self.configuration) as api_client:
            # create an inbox using the inbox controller
            api_instance = mailslurp_client.InboxControllerApi(api_client)
            inbox = api_instance.create_inbox()
            return inbox
