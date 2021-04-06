<?php

class SignUpTestCest
{
    public function canTestUserSignUp(AcceptanceTester $I)
    {
        // configure mailslurp client
        $apiKey = getenv("API_KEY");
        if (!$apiKey) {
            throw new Exception("No MailSlurp API_KEY environment variable set");
        }
        $config = MailSlurp\Configuration::getDefaultConfiguration()->setApiKey('x-api-key', $apiKey);

        // create a test inbox
        $inboxController = new MailSlurp\Apis\InboxControllerApi(null, $config);
        $inbox = $inboxController->createInbox();

        // load the app
        $I->amOnPage('/');
        $I->seeElement('[data-test="sign-in-header-section"]');
        // click sign-up
        $I->click('[data-test="sign-in-create-account-link"]');
        // sign up with email and password
        $I->fillField('email', $inbox->getEmailAddress());
        $I->fillField('password', "test-password");
        $I->click('[data-test="sign-up-create-account-button"]');

        // now we need to receive email
        $waitForController = new MailSlurp\Apis\WaitForControllerApi(null, $config);
        $email = $waitForController->waitForLatestEmail($inbox_id = $inbox->getId(), $timeout = 30000, $unread_only = true);

        // extract the confirmation code
        preg_match("/verification code is ([0-9]{6})/", $email->getBody(), $matches);
        $code = $matches[1];

        // submit the confirmation code
        $I->fillField('code', $code);
        $I->click('[data-test="confirm-sign-up-confirm-button"]');

        // now login
        $I->amOnPage("/");
        $I->fillField('username', $inbox->getEmailAddress());
        $I->fillField('password', "test-password");
        $I->click('[data-test="sign-in-sign-in-button"]');

        // can see authenticated welcome
        $I->waitForElement('h1', 30);
        $I->see("Welcome", "h1");
    }
}
