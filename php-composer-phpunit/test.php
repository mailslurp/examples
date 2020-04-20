<?php
require_once(__DIR__ . '/vendor/autoload.php');

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
    private function getConfig()
    {
        // create a mailslurp configuration with API_KEY environment variable
        // get your own free API KEY at https://app.mailslurp.com/sign-up/
        return MailSlurp\Configuration::getDefaultConfiguration()
            ->setApiKey('x-api-key', getenv("API_KEY"));
    }

    public function test_CanCreateAnInbox_ThenSendAndReceiveEmails()
    {
        // create an inbox controller
        $inboxController = new MailSlurp\Apis\InboxControllerApi(null, $this->getConfig());

        // create an inbox
        $inbox = $inboxController->createInbox();

        // verify inbox has an email address ending in @mailslurp.com
        $this->assertStringContainsString(
            "mailslurp.com",
            $inbox->getEmailAddress()
        );
    }

    public function test_CanSendAndReceiveEmail_BetweenTwoInboxes()
    {
        // create inbox and waitFor controllers
        $inbox_controller = new MailSlurp\Apis\InboxControllerApi(null, $this->getConfig());
        $wait_for_controller = new MailSlurp\Apis\WaitForControllerApi(null, $this->getConfig());

        // create two inboxes
        $inbox_1 = $inbox_controller->createInbox();
        $inbox_2 = $inbox_controller->createInbox();

        // send a confirmation code from inbox1 to inbox2 (sends an actual email)
        $send_options = new MailSlurp\Models\SendEmailOptions();
        $send_options->setTo([$inbox_2->getEmailAddress()]);
        $send_options->setSubject("Test");
        $send_options->setBody("Confirmation code = abc123");
        $inbox_controller->sendEmail($inbox_1->getId(), $send_options);

        // receive email for inbox2
        $timeout_ms = 30000;
        $unread_only = true;
        $email = $wait_for_controller->waitForLatestEmail($inbox_2->getId(), $timeout_ms, $unread_only);

        // verify emails content
        $this->assertEquals($inbox_1->getEmailAddress(), $email->getFrom());
        $this->assertEquals($inbox_2->getEmailAddress(), $email->getTo()[0]);
        $this->assertEquals("Test", $email->getSubject());
        $this->assertStringContainsString("Confirmation code = ", $email->getBody());

        // extract part of an email using regex (could be used in further test steps)
        $matches = array();
        preg_match('/.+code = (.+)/', $email->getBody(), $matches);
        $confirmation_code = $matches[1];
        $this->assertEquals($confirmation_code, "abc123");
    }

}
