import os
import logging

logging.basicConfig(level=logging.INFO)
MAILSLURP_API_KEY = os.getenv("API_KEY")
if not MAILSLURP_API_KEY:
    raise ValueError("API_KEY environment variable is not set")

#<gen>locust_email_test
from locust import HttpUser, task, between
import mailslurp_client

# Load test user sign up and email confirmation
class EmailSignUpLoadTest(HttpUser):
    wait_time = between(1, 5)

    @task
    def sign_up_and_receive_email(self):
        # configure mailslurp client config
        configuration = mailslurp_client.Configuration()
        configuration.api_key["x-api-key"] = MAILSLURP_API_KEY

        with mailslurp_client.ApiClient(configuration) as api_client:
            # create unique email account for a user
            logging.info("Creating unique email account")
            inbox_controller = mailslurp_client.InboxControllerApi(api_client)
            inbox = inbox_controller.create_inbox_with_defaults()

            # submit the email to our test application sign-up url
            logging.info("Posting magic link request for %s", inbox.email_address)
            response = self.client.post(
                "/test-application/magic-link",
                data={"emailAddress": inbox.email_address},
                name="/magic-link"
            )
            response.raise_for_status()

            # wait for email to be sent and received by account
            logging.info("Waiting for email to be received")
            wait_controller = mailslurp_client.WaitForControllerApi(api_client)
            email = wait_controller.wait_for_latest_email(
                inbox_id=inbox.id, timeout=60_000, unread_only=True
            )

            # confirm email has correct information
            logging.info("Received email with subject: %s", email.subject)
            assert email.subject == "Please confirm your email address", "Magic‑link email has subject"
#</gen>