<?php
require_once realpath(__DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php');

$dotenv = Dotenv\Dotenv::createImmutable(realpath(__DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..'));
$dotenv->load();

//<gen>php_pest_example
test('can send and receive email in pest', function () {
    $YOUR_API_KEY = $_ENV["API_KEY"];
    expect($YOUR_API_KEY)->toBeTruthy("Expect API KEY environment variable");

    $config = MailSlurp\Configuration::getDefaultConfiguration()
        ->setApiKey('x-api-key', $YOUR_API_KEY);
    $inbox_controller = new MailSlurp\Apis\InboxControllerApi(null, $config);

    // create inbox
    $options = new \MailSlurp\Models\CreateInboxDto();
    $options->setName("Test inbox");
    $options->setPrefix("test");
    $inbox = $inbox_controller->createInboxWithOptions($options);

    // send email
    $send_options = new MailSlurp\Models\SendEmailOptions();
    $send_options->setTo([$inbox->getEmailAddress()]);
    $send_options->setSubject("Test");
    $send_options->setBody("Confirmation code = abc123");
    $inbox_controller->sendEmail($inbox->getId(), $send_options);

    // read email
    $wait_for_controller = new MailSlurp\Apis\WaitForControllerApi(null, $config);
    $timeout_ms = 30000;
    $unread_only = true;
    $email = $wait_for_controller->waitForLatestEmail($inbox->getId(), $timeout_ms, $unread_only);

    expect($email->getFrom())->toEqual($inbox->getEmailAddress());
});
//</gen>