<?php
//<gen>phpunit_import
require_once(__DIR__ . '/vendor/autoload.php');
//</gen>
use PHPUnit\Framework\TestCase;

/**
 * This testsuite demonstrates how to use MailSlurp Email API Client in PHP
 *
 * MailSlurp let's you create real email addresses in PHP. You can then send and receive emails
 * and attachments in PHP applications and tests.
 *
 * See https://www.mailslurp.com/docs/ for more information.
 *
 */
final class EmailTest extends TestCase
{

    public function test_simpleUsecase() {
        //<gen>phpunit_simple_usecase
        // configure mailslurp/mailslurp-client-php library
        $config = MailSlurp\Configuration::getDefaultConfiguration()
            ->setApiKey('x-api-key', getenv("API_KEY"));
        $inboxController = new MailSlurp\Apis\InboxControllerApi(null, $config);
        // create an inbox
        $inbox = $inboxController->createInboxWithDefaults();
        // send an email
        $sendOptions = new MailSlurp\Models\SendEmailOptions();
        $sendOptions->setTo([$inbox->getEmailAddress()]);
        $sendOptions->setSubject("Test");
        $sendOptions->setBody("Hello");
        $inboxController->sendEmail($inbox->getId(), $sendOptions);
        // receive the email
        $waitForController = new MailSlurp\Apis\WaitForControllerApi(null, $config);
        $email = $waitForController->waitForLatestEmail($inbox->getId(), 120000, true);
        $this->assertNotNull($email->getBody());
        //</gen>
    }

    //<gen>phpunit_get_config
    private function getConfig()
    {
        // create a mailslurp configuration with API_KEY environment variable
        // get your own free API KEY at https://app.mailslurp.com/sign-up/
        return MailSlurp\Configuration::getDefaultConfiguration()
            ->setApiKey('x-api-key', getenv("API_KEY"));
    }
    //</gen>

    public function test_CanCreateAnInbox_ThenSendAndReceiveEmails()
    {
        // create an inbox controller
        //<gen>phpunit_create_controller
        $inboxController = new MailSlurp\Apis\InboxControllerApi(null, $this->getConfig());
        //</gen>

        // create an inbox
        //<gen>phpunit_create_inbox
        $options = new \MailSlurp\Models\CreateInboxDto();
        $options->setName("Test inbox");
        $options->setPrefix("test");
        $inbox = $inboxController->createInboxWithOptions($options);
        //</gen>
        // verify inbox has an email address ending in @mailslurp.com
        $this->assertStringContainsString(
            "mailslurp.com",
            $inbox->getEmailAddress()
        );
    }

    public function test_SmtpAccess()
    {
        $inboxController = new MailSlurp\Apis\InboxControllerApi(null, $this->getConfig());
        // create an smtp inbox
        //<gen>phpunit_create_smtp_inbox
        $options = new \MailSlurp\Models\CreateInboxDto();
        $options->setInboxType("SMTP_INBOX");
        $inbox_smtp = $inboxController->createInboxWithOptions($options);
        //</gen>
        $inbox_recipient = $inboxController->createInboxWithDefaults();

        //<gen>phpunit_phpmailer_config
        $access_details = $inboxController->getImapSmtpAccess($inbox_smtp->getId());
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        // set mail server settings using the inbox access details
        $mail->isSMTP();
        $mail->Host       = $access_details->getSecureSmtpServerHost();
        $mail->SMTPAuth   = true;
        $mail->Username   = $access_details->getSecureSmtpUsername();
        $mail->Password   = $access_details->getSecureSmtpPassword();
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $access_details->getSecureSmtpServerPort();
        //</gen>
        //<gen>phpunit_smtp_send
        $mail->setFrom($inbox_smtp->getEmailAddress(), $inbox_smtp->getName());
        $mail->addAddress($inbox_recipient->getEmailAddress());     //Add a recipient
        $mail->isHTML(true);                                  //Set email format to HTML
        $mail->Subject = 'Testing smtp sending';
        $mail->Body    = 'This is the body';
        $mail->send();
        //</gen>
        //<gen>phpunit_smtp_receive
        $wait_for_controller = new MailSlurp\Apis\WaitForControllerApi(null, $this->getConfig());
        $email = $wait_for_controller->waitForLatestEmail($inbox_recipient->getId());
        $this->assertStringContainsString("smtp sending", $email->getSubject());
        //</gen>
    }

    public function test_CanSendAndReceiveEmail_BetweenTwoInboxes()
    {
        // create inbox and waitFor controllers
        $inbox_controller = new MailSlurp\Apis\InboxControllerApi(null, $this->getConfig());
        //<gen>phpunit_create_waitfor_controller
        $wait_for_controller = new MailSlurp\Apis\WaitForControllerApi(null, $this->getConfig());
        //</gen>
        // create two inboxes
        $inbox = $inbox_controller->createInbox();
        $inbox_2 = $inbox_controller->createInbox();

        // send a confirmation code from inbox1 to inbox2 (sends an actual email)
        //<gen>phpunit_send_email
        $send_options = new MailSlurp\Models\SendEmailOptions();
        $send_options->setTo([$inbox->getEmailAddress()]);
        $send_options->setSubject("Test");
        $send_options->setBody("Confirmation code = abc123");
        $inbox_controller->sendEmail($inbox_2->getId(), $send_options);
        //</gen>

        // receive email for inbox2
        //<gen>phpunit_wait_for_email
        $timeout_ms = 30000;
        $unread_only = true;
        $email = $wait_for_controller->waitForLatestEmail($inbox->getId(), $timeout_ms, $unread_only);
        //</gen>

        //<gen>phpunit_email_count
        $inbox_email_count = $inbox_controller->getInboxEmailCount($inbox->getId());
        //</gen>
        $this->assertGreaterThan(0, $inbox_email_count);

        //<gen>phpunit_get_emails
        $emails = $inbox_controller->getEmails($inbox->getId());
        //</gen>

        //<gen>phpunit_get_emails_paginated
        $emails_paginated = $inbox_controller->getInboxEmailsPaginated($inbox->getId(), $page = 0, $size = 20);
        $email = $emails_paginated->getContent()[0];
        //</gen>
        $email_id = $emails[0]->getId();

        //<gen>phpunit_get_email
        $email_controller = new MailSlurp\Apis\EmailControllerApi(null, $this->getConfig());
        $email = $email_controller->getEmail($email_id);
        //</gen>

        // verify emails content
        $this->assertEquals($inbox_2->getEmailAddress(), $email->getFrom());
        $this->assertEquals($inbox->getEmailAddress(), $email->getTo()[0]);
        $this->assertEquals("Test", $email->getSubject());
        $this->assertStringContainsString("Confirmation code = ", $email->getBody());

        // extract part of an email using regex (could be used in further test steps)
        //<gen>phpunit_extract_pattern
        $matches = array();
        preg_match('/.+code = (.+)/', $email->getBody(), $matches);
        $confirmation_code = $matches[1];
        $this->assertEquals($confirmation_code, "abc123");
        //</gen>
    }

}
