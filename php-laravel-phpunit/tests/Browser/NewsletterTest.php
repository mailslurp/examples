<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use MailSlurp;
use Tests\DuskTestCase;


class NewsletterTest extends DuskTestCase
{

    //<gen>php_laravel_phpunit_dusk_test_newsletter_mailable
    public function testNewsletterMailable(): void
    {

        $this->browse(function (Browser $browser) {
            $MAILSLURP_API_KEY = env('API_KEY');
            // configure mailslurp client
            $config = MailSlurp\Configuration::getDefaultConfiguration()->setApiKey('x-api-key', $MAILSLURP_API_KEY);
            $inboxController = new MailSlurp\Apis\InboxControllerApi(null, $config);

            // create a disposable email address
            $inbox = $inboxController->createInboxWithDefaults();

            // load the app in the browser
            $browser->resize(1440, 900);
            $browser->visit('http://localhost:8000/')
                ->assertSee('Sign up for our newsletter');
            $browser->screenshot('welcome');

            // click the newsletter link
            $browser->click('[data-test-id="newsletter-link"]');
            $browser->waitFor('[data-test-id="newsletter-form"]');
            $browser->screenshot('newsletter-form');

            // fill the newsletter sign up form with the disposable email address
            $browser->type('#email', $inbox->getEmailAddress());
            $browser->screenshot('newsletter-form-filled');
            $browser->click('#submit');

            // submit the form and see a success message
            $browser->waitFor('[data-test-id="newsletter-success"]');
            $browser->screenshot('newsletter-success');

            // now use MailSlurp to await the email sent by our NewsletterController
            $waitForController = new MailSlurp\Apis\WaitForControllerApi(null, $config);
            $email = $waitForController->waitForLatestEmail($inbox->getId(), 60_000, true);
            assert($email->getSubject() === 'Welcome to our newsletter');
        });
    }
    //</gen>
    //<gen>php_laravel_phpunit_dusk_test_newsletter_mailable
    public function testNewsletterNotification(): void
    {

        $this->browse(function (Browser $browser) {
            $MAILSLURP_API_KEY = env('API_KEY');
            // configure mailslurp client
            $config = MailSlurp\Configuration::getDefaultConfiguration()->setApiKey('x-api-key', $MAILSLURP_API_KEY);
            $inboxController = new MailSlurp\Apis\InboxControllerApi(null, $config);

            // create a disposable email address
            $inbox = $inboxController->createInboxWithDefaults();

            // load the app in the browser
            $browser->resize(1440, 900);
            $browser->visit('http://localhost:8000/')
                ->assertSee('Get notifications');

            // click the newsletter link
            $browser->click('[data-test-id="notification-link"]');
            $browser->waitFor('[data-test-id="notification-form"]');
            $browser->screenshot('notification-form');

            // fill the newsletter sign up form with the disposable email address
            $browser->type('#email', $inbox->getEmailAddress());
            $browser->screenshot('notification-form-filled');
            $browser->click('#submit');

            // submit the form and see a success message
            $browser->waitFor('[data-test-id="notification-success"]');
            $browser->screenshot('newsletter-success');

            // now use MailSlurp to await the email sent by our NewsletterController
            $waitForController = new MailSlurp\Apis\WaitForControllerApi(null, $config);
            $email = $waitForController->waitForLatestEmail($inbox->getId(), 60_000, true);
            $this->assertContains('Welcome to our notifications', $email->getBody());
        });
    }
    //</gen>
}
