import os
import unittest

# get api key from env
YOUR_API_KEY = os.getenv("API_KEY")

# <gen>pyunit_demo_configure_client
import mailslurp_client

configuration = mailslurp_client.Configuration()
configuration.api_key["x-api-key"] = YOUR_API_KEY
# </gen>


class TestAddFunction(unittest.TestCase):
    def test_attachments(self):
        with mailslurp_client.ApiClient(configuration) as api_client:
            # <gen>pyunit_demo_upload_attachment
            import base64

            attachment_controller = mailslurp_client.AttachmentControllerApi(api_client)
            options = mailslurp_client.UploadAttachmentOptions(
                filename="test.txt",
                content_type="text/plain",
                base64_contents=base64.b64encode("Hello world".encode("utf-8")).decode(
                    "utf-8"
                ),
            )
            attachment_ids = attachment_controller.upload_attachment(options)
            self.assertTrue(len(attachment_ids) == 1)
            # </gen>
            inbox_controller = mailslurp_client.InboxControllerApi(api_client)
            inbox = inbox_controller.create_inbox_with_defaults()
            recipient = inbox_controller.create_inbox_with_defaults()
            # <gen>pyunit_demo_send_email_with_attachment
            send_options = mailslurp_client.SendEmailOptions(
                to=[recipient.email_address],
                subject="Hello",
                body="Here is your email body",
                attachments=attachment_ids,
            )
            sent = inbox_controller.send_email_and_confirm(
                inbox_id=inbox.id, send_email_options=send_options
            )
            self.assertTrue(sent.sent_at is not None)
            # </gen>
            inbox = recipient
            # <gen>pyunit_demo_wait_for
            wait_for_controller = mailslurp_client.WaitForControllerApi(api_client)
            email = wait_for_controller.wait_for_latest_email(
                inbox_id=inbox.id, timeout=60_000, unread_only=True
            )
            self.assertTrue("Hello" in email.subject)
            # </gen>
            # <gen>pyunit_demo_matching
            matching_emails = wait_for_controller.wait_for_matching_emails(
                inbox_id=inbox.id,
                timeout=60_000,
                unread_only=False,
                match_options=mailslurp_client.MatchOptions(
                    conditions=[
                        mailslurp_client.ConditionOption(
                            condition="HAS_ATTACHMENTS", value="TRUE"
                        )
                    ],
                    matches=[
                        mailslurp_client.MatchOption(
                            field="SUBJECT", should="CONTAIN", value="Hello"
                        )
                    ],
                ),
                count=1,
            )
            self.assertTrue(len(matching_emails) > 0)
            # </gen>
            # <gen>pyunit_demo_download_attachment
            attachment_content = attachment_controller.download_attachment_as_base64_encoded(email.attachments[0])
            attachment_metadata = attachment_controller.get_attachment_info(email.attachments[0])
            self.assertEqual(attachment_metadata.content_type, "text/plain")
            # </gen>
            self.assertIsNotNone(attachment_content)
            email_id = email.id
            # <gen>pyunit_demo_fetch_email
            email_controller = mailslurp_client.EmailControllerApi(api_client)
            email = email_controller.get_email(email_id=email_id)
            self.assertTrue("Hello" in email.subject)
            # </gen>


    def test_configure(self):
        # <gen>pyunit_demo_configure_instance
        with mailslurp_client.ApiClient(configuration) as api_client:
            api_instance = mailslurp_client.InboxControllerApi(api_client)
            # </gen>
            self.assertIsNotNone(api_instance)
            # <gen>pyunit_demo_create_inbox
            inbox_controller = mailslurp_client.InboxControllerApi(api_client)
            inbox = inbox_controller.create_inbox_with_defaults()
            self.assertTrue("@mailslurp" in inbox.email_address)
            # </gen>
            # <gen>pyunit_demo_create_inbox_options
            options = mailslurp_client.CreateInboxDto()
            options.name = "Test inbox"
            options.inbox_type = "SMTP_INBOX"
            inbox = inbox_controller.create_inbox_with_options(options)
            self.assertTrue("@mailslurp" in inbox.email_address)
            # </gen>
            # <gen>pyunit_demo_imap_access
            smtp_access = inbox_controller.get_imap_smtp_access(inbox_id=inbox.id)
            self.assertIsNotNone(smtp_access.secure_smtp_server_host)
            # </gen>
            # <gen>pyunit_demo_send_smtp
            # configure smtp client using access details
            from smtplib import SMTP

            with SMTP(
                host=smtp_access.secure_smtp_server_host,
                port=smtp_access.secure_smtp_server_port,
            ) as smtp:
                msg = "Subject: Test subject\r\n\r\nThis is the body"
                smtp.login(
                    user=smtp_access.secure_smtp_username,
                    password=smtp_access.secure_smtp_password,
                )
                smtp.sendmail(
                    from_addr=inbox.email_address,
                    to_addrs=[inbox.email_address],
                    msg=msg,
                )
                smtp.quit()
            # </gen>
            # <gen>pyunit_demo_list_inboxes
            inboxes = inbox_controller.get_all_inboxes(page=0)

            # pagination properties
            self.assertTrue(inboxes.total_pages > 0)
            self.assertTrue(inboxes.total_elements > 0)

            # view contents
            self.assertIsNotNone(inboxes.content[0].email_address)
            # </gen>
            # <gen>pyunit_demo_get_inbox
            inbox = inbox_controller.get_inbox(inbox_id=inbox.id)
            self.assertTrue("@mailslurp" in inbox.email_address)

            # get by email address
            inbox_by_email = inbox_controller.get_inbox_by_email_address(
                inbox.email_address
            )
            self.assertTrue(inbox_by_email.exists)

            # get by name
            inbox_by_name = inbox_controller.get_inbox_by_name(inbox.name)
            self.assertTrue(inbox_by_name.exists)
            # </gen>
            # <gen>pyunit_demo_delete_inbox
            inbox_controller.delete_inbox(inbox_id=inbox.id)
            # </gen>


if __name__ == "__main__":
    unittest.main()
