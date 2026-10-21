<?php
declare(strict_types=1);

//<gen>inbox_docs_setup
require_once __DIR__ . '/vendor/autoload.php';

use GuzzleHttp\Client;
use MailSlurp\Configuration;
use MailSlurp\Apis\{InboxControllerApi, DomainControllerApi, EmailControllerApi,
    WaitForControllerApi, WebhookControllerApi};
use MailSlurp\Models\{CreateInboxDto, SendEmailOptions, MatchOptions, MatchOption,
    CreateWebhookOptions};

function inboxClients(): array
{
    $key = getenv('MAILSLURP_API_KEY');
    if (!$key) throw new RuntimeException('Set MAILSLURP_API_KEY');
    $config = (new Configuration())->setApiKey('x-api-key', $key);
    $http = new Client(['timeout' => 75, 'connect_timeout' => 10]);
    return [
        'inboxes' => new InboxControllerApi($http, $config),
        'domains' => new DomainControllerApi($http, $config),
        'emails' => new EmailControllerApi($http, $config),
        'wait' => new WaitForControllerApi($http, $config),
        'webhooks' => new WebhookControllerApi($http, $config),
    ];
}
//</gen>

//<gen>inbox_docs_create_random
function createRandomInbox(array $clients)
{
    $options = (new CreateInboxDto())->setName('Signup tests')
        ->setTags(['signup', 'staging']);
    return $clients['inboxes']->createInboxWithOptions($options);
}
//</gen>

//<gen>inbox_docs_create_pool
function createPoolInbox(array $clients)
{
    $options = (new CreateInboxDto())->setUseDomainPool(true);
    return $clients['inboxes']->createInboxWithOptions($options);
}
//</gen>

//<gen>inbox_docs_create_custom
function createCustomInbox(array $clients, string $verifiedAddress)
{
    $options = (new CreateInboxDto())
        ->setEmailAddress($verifiedAddress)
        ->setName('Order notifications');
    return $clients['inboxes']->createInboxWithOptions($options);
}
//</gen>

//<gen>inbox_docs_create_virtual
function createCaptureInbox(array $clients)
{
    $options = (new CreateInboxDto())->setName('Application mail capture')
        ->setVirtualInbox(true);
    return $clients['inboxes']->createInboxWithOptions($options);
}
//</gen>

//<gen>inbox_docs_create_expiring
function createExpiringInbox(array $clients)
{
    $options = (new CreateInboxDto())->setName('One test run')
        ->setExpiresIn(5 * 60 * 1000);
    return $clients['inboxes']->createInboxWithOptions($options);
}
//</gen>

//<gen>inbox_docs_catch_all
function enableCatchAll(array $clients, string $domainId)
{
    $clients['domains']->addDomainWildcardCatchAll($domainId);
    return $clients['domains']->getDomainWildcardCatchAllInbox($domainId);
}
//</gen>

//<gen>inbox_docs_plus_address
function listPlusAddressEmails(array $clients, string $inboxId, string $fullAddress)
{
    $plus = $clients['inboxes']->getOrCreateInboxPlusAddress($inboxId, $fullAddress);
    $emails = $clients['inboxes']->getInboxPlusAddressEmailsForPlusAddressId(
        $plus->getId(), $inboxId, 0, 20, 'DESC'
    );
    return ['plus' => $plus, 'emails' => $emails];
}
//</gen>

//<gen>inbox_docs_send
function sendTestEmail(array $clients, string $inboxId, string $recipient, string $subject)
{
    $options = (new SendEmailOptions())->setTo([$recipient])
        ->setSubject($subject)->setBody('<p>Your account is ready.</p>')->setIsHTML(true);
    return $clients['inboxes']->sendEmailAndConfirm($inboxId, $options);
}
//</gen>

//<gen>inbox_docs_wait_latest
function waitForLatest(array $clients, string $inboxId, DateTime $since)
{
    // Capture $since before triggering the application; use an isolated inbox.
    return $clients['wait']->waitForLatestEmail(
        inbox_id: $inboxId, timeout: 60000, unread_only: true, since: $since->format(DATE_ATOM)
    );
}
//</gen>

//<gen>inbox_docs_wait_matching
function waitForMatching(array $clients, string $inboxId, string $recipient,
    string $subject, DateTime $since)
{
    $match = (new MatchOptions())->setMatches([
        (new MatchOption())->setField('SUBJECT')->setShould('CONTAIN')->setValue($subject),
        (new MatchOption())->setField('TO')->setShould('CONTAIN')->setValue($recipient),
    ]);
    return $clients['wait']->waitForMatchingFirstEmail(
        inbox_id: $inboxId, match_options: $match, timeout: 60000,
        unread_only: true, since: $since->format(DATE_ATOM)
    );
}
//</gen>

//<gen>inbox_docs_list_inboxes
function listTaggedInboxes(array $clients, string $tag, int $page = 0)
{
    return $clients['inboxes']->getAllInboxes(page: $page, size: 20, sort: 'DESC', tag: $tag);
}
//</gen>

//<gen>inbox_docs_list_emails
function listInboxEmails(array $clients, string $inboxId, int $page = 0)
{
    return $clients['inboxes']->getInboxEmailsPaginated($inboxId, $page, 20, 'DESC');
}
//</gen>

//<gen>inbox_docs_get_email
function getFullEmail(array $clients, string $emailId)
{
    return $clients['emails']->getEmail($emailId);
}
//</gen>

//<gen>inbox_docs_get_inbox
function getSavedInbox(array $clients, string $inboxId)
{
    return $clients['inboxes']->getInbox($inboxId);
}
//</gen>

//<gen>inbox_docs_access
function getInboxAccess(array $clients, string $inboxId)
{
    // Keep these passwords private; do not print the returned object.
    return $clients['inboxes']->getImapSmtpAccess($inboxId);
}
//</gen>

//<gen>inbox_docs_imap_tls
function unreadImapUids(array $clients, string $inboxId): array
{
    // Requires PHP's IMAP extension; use the inbox-scoped mailbox name.
    $access = $clients['inboxes']->getImapSmtpAccess($inboxId);
    $mailbox = sprintf('{%s:%d/imap/ssl/validate-cert}%s',
        $access->getSecureImapServerHost(), $access->getSecureImapServerPort(),
        $access->getImapMailbox());
    imap_timeout(IMAP_OPENTIMEOUT, 30);
    imap_timeout(IMAP_READTIMEOUT, 30);
    $connection = @imap_open($mailbox, $access->getSecureImapUsername(),
        $access->getSecureImapPassword(), OP_READONLY, 1);
    if ($connection === false) throw new RuntimeException('IMAP connection failed');
    try {
        imap_errors(); // Clear older errors before checking this search.
        $uids = imap_search($connection, 'UNSEEN', SE_UID);
        if ($uids === false && imap_errors()) {
            throw new RuntimeException('IMAP search failed');
        }
        return $uids ?: [];
    } finally {
        imap_close($connection);
    }
}
//</gen>

//<gen>inbox_docs_webhook
function createInboxWebhook(array $clients, string $inboxId, string $receiverUrl)
{
    $options = (new CreateWebhookOptions())->setUrl($receiverUrl)
        ->setEventName('EMAIL_RECEIVED');
    return $clients['webhooks']->createWebhook($inboxId, $options);
}
//</gen>

//<gen>inbox_docs_delete_inbox
function deleteDisposableInbox(array $clients, string $inboxId): void
{
    // Call only for an inbox whose address and messages you no longer need.
    $clients['inboxes']->deleteInbox($inboxId);
}
//</gen>
