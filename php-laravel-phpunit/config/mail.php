<?php

$MAILSLURP_API_KEY = env('API_KEY');

//<gen>php_laravel_phpunit_mail_config
// configure mailslurp client
$config = MailSlurp\Configuration::getDefaultConfiguration()->setApiKey('x-api-key', $MAILSLURP_API_KEY);

// create an inbox to send emails from
$inboxController = new MailSlurp\Apis\InboxControllerApi(null, $config);
$senderInbox = $inboxController->createInboxWithOptions(new \MailSlurp\Models\CreateInboxDto(['inbox_type' => 'SMTP_INBOX', 'name' => 'Newsletters']));
$accessOptions = $inboxController->getImapSmtpAccess($senderInbox->getId());

// get access to the inbox
$host = $accessOptions->getSecureSmtpServerHost();
$port = $accessOptions->getSecureSmtpServerPort();
$username = $accessOptions->getSecureSmtpUsername();
$password = $accessOptions->getSecureSmtpPassword();

// configure laravel mailer settings to use our sender inbox
// for production apps set this in .env instead with static values
// make sure you run `API_KEY=$(API_KEY) php artisan config:cache` after setting
return [
    'default' => 'smtp',
    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'url' => env('MAIL_URL'),
            'host' => $host,
            'port' => $port,
            'encryption' => 'tls',
            'username' => $username,
            'password' => $password,
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN'),
        ],
    ],
    'from' => [
        'address' => $senderInbox->getEmailAddress(),
        'name' => $senderInbox->getName(),
    ],
    'markdown' => [
        'theme' => 'default',
        'paths' => [
            resource_path('views/vendor/mail'),
        ],
    ],
];
//</gen>
