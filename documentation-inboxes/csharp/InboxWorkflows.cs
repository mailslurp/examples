//<gen>inbox_docs_setup
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Security;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

public static class InboxSetup
{
    public static Configuration CreateConfiguration()
    {
        var apiKey = Environment.GetEnvironmentVariable("MAILSLURP_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Set MAILSLURP_API_KEY");
        var configuration = new Configuration { Timeout = TimeSpan.FromSeconds(75) };
        configuration.ApiKey.Add("x-api-key", apiKey);
        return configuration;
    }
}
//</gen>

// Independent helpers: building this library makes no requests.
public static class InboxWorkflows
{
    //<gen>inbox_docs_create_random
    public static InboxDto CreateRandom(Configuration configuration)
    {
        return new InboxControllerApi(configuration).CreateInboxWithOptions(
            new CreateInboxDto(name: "Signup tests", tags: new List<string> { "signup", "staging" }));
    }
    //</gen>

    //<gen>inbox_docs_create_pool
    public static InboxDto CreatePool(Configuration configuration)
    {
        return new InboxControllerApi(configuration).CreateInboxWithOptions(
            new CreateInboxDto(useDomainPool: true));
    }
    //</gen>

    //<gen>inbox_docs_create_custom
    public static InboxDto CreateCustom(Configuration configuration, string verifiedAddress)
    {
        // Pass a full address on a custom domain already verified in your account.
        return new InboxControllerApi(configuration).CreateInboxWithOptions(
            new CreateInboxDto(emailAddress: verifiedAddress, name: "Order notifications"));
    }
    //</gen>

    //<gen>inbox_docs_create_virtual
    public static InboxDto CreateVirtual(Configuration configuration)
    {
        return new InboxControllerApi(configuration).CreateInboxWithOptions(
            new CreateInboxDto(name: "Application mail capture", virtualInbox: true));
    }
    //</gen>

    //<gen>inbox_docs_create_expiring
    public static InboxDto CreateExpiring(Configuration configuration)
    {
        return new InboxControllerApi(configuration).CreateInboxWithOptions(
            new CreateInboxDto(name: "One test run", expiresIn: 300_000));
    }
    //</gen>

    //<gen>inbox_docs_catch_all
    public static InboxDto CatchAll(Configuration configuration, Guid verifiedDomainId)
    {
        var domains = new DomainControllerApi(configuration);
        domains.AddDomainWildcardCatchAll(verifiedDomainId);
        return domains.GetDomainWildcardCatchAllInbox(verifiedDomainId);
    }
    //</gen>

    //<gen>inbox_docs_plus_address
    public static (PlusAddressDto Plus, PageEmailPreview Emails) PlusAddress(
        Configuration configuration, Guid inboxId,
        string fullPlusAddress)
    {
        // Use the existing inbox's address with a suffix, such as qa+signup@your-domain.com.
        var inboxes = new InboxControllerApi(configuration);
        var plus = inboxes.GetOrCreateInboxPlusAddress(inboxId, fullPlusAddress);
        var emails = inboxes.GetInboxPlusAddressEmailsForPlusAddressId(
            plusAddressId: plus.Id, inboxId: inboxId, page: 0, size: 20, sort: "DESC");
        return (plus, emails);
    }
    //</gen>

    //<gen>inbox_docs_send
    public static SentEmailDto Send(Configuration configuration, Guid senderInboxId,
        string ownedRecipientAddress)
    {
        return new InboxControllerApi(configuration).SendEmailAndConfirm(senderInboxId,
            new SendEmailOptions(to: new List<string> { ownedRecipientAddress },
                subject: "Welcome to the application", body: "<p>Your account is ready.</p>",
                isHTML: true));
    }
    //</gen>

    //<gen>inbox_docs_list_inboxes
    public static PageInboxProjection ListInboxes(Configuration configuration, string tag, int page)
    {
        return new InboxControllerApi(configuration).GetAllInboxes(
            page: page, size: 20, sort: "DESC", tag: tag);
    }
    //</gen>

    //<gen>inbox_docs_get_inbox
    public static InboxDto GetInbox(Configuration configuration, Guid inboxId)
    {
        return new InboxControllerApi(configuration).GetInbox(inboxId);
    }
    //</gen>

    //<gen>inbox_docs_list_emails
    public static PageEmailPreview ListEmails(Configuration configuration, Guid inboxId, int page)
    {
        return new InboxControllerApi(configuration).GetInboxEmailsPaginated(
            inboxId: inboxId, page: page, size: 20, sort: "DESC");
    }
    //</gen>

    //<gen>inbox_docs_get_email
    public static Email GetEmail(Configuration configuration, Guid emailId)
    {
        return new EmailControllerApi(configuration).GetEmail(emailId);
    }
    //</gen>

    //<gen>inbox_docs_delete_inbox
    public static void DeleteInbox(Configuration configuration, Guid disposableInboxId)
    {
        // Call only after exporting anything needed and removing references to this inbox.
        new InboxControllerApi(configuration).DeleteInbox(disposableInboxId);
    }
    //</gen>

    //<gen>inbox_docs_webhook
    public static WebhookDto Webhook(Configuration configuration, Guid inboxId, string receiverUrl)
    {
        // receiverUrl is your HTTPS endpoint; validate signatures and handle retries there.
        if (!Uri.TryCreate(receiverUrl, UriKind.Absolute, out var receiver)
            || receiver.Scheme != Uri.UriSchemeHttps)
            throw new ArgumentException("Use an HTTPS webhook receiver", nameof(receiverUrl));
        return new WebhookControllerApi(configuration).CreateWebhook(inboxId,
            new CreateWebhookOptions(url: receiverUrl,
                eventName: CreateWebhookOptions.EventNameEnum.EMAILRECEIVED));
    }
    //</gen>

    //<gen>inbox_docs_access
    public static ImapSmtpAccessDetails Access(Configuration configuration, Guid inboxId)
    {
        // Contains passwords. Keep the result private; never log or serialize it into reports.
        return new InboxControllerApi(configuration).GetImapSmtpAccess(inboxId: inboxId);
    }
    //</gen>

    //<gen>inbox_docs_wait_latest
    public static Email WaitLatest(Configuration configuration, Guid inboxId, DateTime receivedSinceUtc)
    {
        // Record this UTC boundary before triggering the application; use an isolated inbox.
        if (receivedSinceUtc.Kind != DateTimeKind.Utc)
            throw new ArgumentException("Use a UTC boundary", nameof(receivedSinceUtc));
        return new WaitForControllerApi(configuration).WaitForLatestEmail(
            inboxId: inboxId, timeout: 60_000, unreadOnly: true, since: receivedSinceUtc);
    }
    //</gen>

    //<gen>inbox_docs_wait_matching
    public static Email WaitMatching(Configuration configuration, Guid inboxId,
        string fullRecipient, string subjectFragment, DateTime receivedSinceUtc)
    {
        // Record this UTC boundary before triggering the attempt; use a unique subject fragment.
        if (receivedSinceUtc.Kind != DateTimeKind.Utc)
            throw new ArgumentException("Use a UTC boundary", nameof(receivedSinceUtc));
        var matches = new MatchOptions(matches: new List<MatchOption>
        {
            new MatchOption(field: MatchOption.FieldEnum.TO,
                should: MatchOption.ShouldEnum.CONTAIN, value: fullRecipient),
            new MatchOption(field: MatchOption.FieldEnum.SUBJECT,
                should: MatchOption.ShouldEnum.CONTAIN, value: subjectFragment)
        });
        return new WaitForControllerApi(configuration).WaitForMatchingFirstEmail(
            inboxId: inboxId, matchOptions: matches, timeout: 60_000,
            unreadOnly: true, since: receivedSinceUtc);
    }
    //</gen>

    //<gen>inbox_docs_imap_tls
    public static async Task<int> ImapTls(Configuration configuration, Guid inboxId)
    {
        var access = new InboxControllerApi(configuration).GetImapSmtpAccess(inboxId: inboxId);
        using var imap = new ImapClient { Timeout = 30_000 };
        // MailKit validates the server certificate and host by default. Keep that enabled.
        await imap.ConnectAsync(access.SecureImapServerHost, access.SecureImapServerPort,
            SecureSocketOptions.SslOnConnect);
        await imap.AuthenticateAsync(access.SecureImapUsername, access.SecureImapPassword);
        var folder = await imap.GetFolderAsync(access.ImapMailbox);
        await folder.OpenAsync(FolderAccess.ReadOnly);
        var count = folder.Count;
        await folder.CloseAsync(false);
        await imap.DisconnectAsync(true);
        return count;
    }
    //</gen>
}
