//<gen>inbox_docs_setup
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.*;
import jakarta.mail.Folder;
import jakarta.mail.Session;
import jakarta.mail.Store;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Properties;
import java.util.UUID;

final class InboxSetup {
    static ApiClient createClient() {
        String apiKey = System.getenv("MAILSLURP_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Set MAILSLURP_API_KEY");
        }
        ApiClient client = new ApiClient();
        client.setApiKey(apiKey);
        client.setConnectTimeout(10_000);
        client.setReadTimeout(75_000);
        return client;
    }
}
//</gen>

/** Independent examples. No main method: loading or compiling this file makes no requests. */
public final class InboxWorkflows {
    private InboxWorkflows() {}

    //<gen>inbox_docs_create_random
    public static InboxDto createRandom(ApiClient client) throws ApiException {
        return new InboxControllerApi(client).createInboxWithOptions(new CreateInboxDto()
            .name("Signup tests").tags(Arrays.asList("signup", "staging"))).execute();
    }
    //</gen>

    //<gen>inbox_docs_create_pool
    public static InboxDto createPool(ApiClient client) throws ApiException {
        return new InboxControllerApi(client).createInboxWithOptions(new CreateInboxDto()
            .useDomainPool(true)).execute();
    }
    //</gen>

    //<gen>inbox_docs_create_custom
    public static InboxDto createCustom(ApiClient client, String verifiedAddress) throws ApiException {
        // Pass a full address on a custom domain already verified in your account.
        return new InboxControllerApi(client).createInboxWithOptions(new CreateInboxDto()
            .emailAddress(verifiedAddress).name("Order notifications")).execute();
    }
    //</gen>

    //<gen>inbox_docs_create_virtual
    public static InboxDto createVirtual(ApiClient client) throws ApiException {
        return new InboxControllerApi(client).createInboxWithOptions(new CreateInboxDto()
            .name("Application mail capture").virtualInbox(true)).execute();
    }
    //</gen>

    //<gen>inbox_docs_create_expiring
    public static InboxDto createExpiring(ApiClient client) throws ApiException {
        return new InboxControllerApi(client).createInboxWithOptions(new CreateInboxDto()
            .name("One test run").expiresIn(300_000L)).execute();
    }
    //</gen>

    //<gen>inbox_docs_catch_all
    public static InboxDto catchAll(ApiClient client, UUID verifiedDomainId) throws ApiException {
        DomainControllerApi domains = new DomainControllerApi(client);
        domains.addDomainWildcardCatchAll(verifiedDomainId).execute();
        return domains.getDomainWildcardCatchAllInbox(verifiedDomainId).execute();
    }
    //</gen>

    //<gen>inbox_docs_plus_address
    public static final class PlusAddressResult {
        public final PlusAddressDto plus;
        public final PageEmailPreview emails;

        PlusAddressResult(PlusAddressDto plus, PageEmailPreview emails) {
            this.plus = plus;
            this.emails = emails;
        }
    }

    public static PlusAddressResult plusAddress(ApiClient client, UUID inboxId,
                                                String fullPlusAddress) throws ApiException {
        // Use the existing inbox's address with a suffix, such as qa+signup@your-domain.com.
        InboxControllerApi inboxes = new InboxControllerApi(client);
        PlusAddressDto plus = inboxes.getOrCreateInboxPlusAddress(inboxId, fullPlusAddress).execute();
        PageEmailPreview emails = inboxes.getInboxPlusAddressEmailsForPlusAddressId(plus.getId(), inboxId)
            .page(0).size(20).sort("DESC").execute();
        return new PlusAddressResult(plus, emails);
    }
    //</gen>

    //<gen>inbox_docs_send
    public static SentEmailDto send(ApiClient client, UUID senderInboxId,
                                    String ownedRecipientAddress) throws ApiException {
        return new InboxControllerApi(client).sendEmailAndConfirm(senderInboxId,
            new SendEmailOptions().to(Arrays.asList(ownedRecipientAddress))
                .subject("Welcome to the application")
                .body("<p>Your account is ready.</p>").isHTML(true)).execute();
    }
    //</gen>

    //<gen>inbox_docs_list_inboxes
    public static PageInboxProjection listInboxes(ApiClient client, String tag,
                                                 int page) throws ApiException {
        return new InboxControllerApi(client).getAllInboxes()
            .tag(tag).page(page).size(20).sort("DESC").execute();
    }
    //</gen>

    //<gen>inbox_docs_get_inbox
    public static InboxDto getInbox(ApiClient client, UUID inboxId) throws ApiException {
        return new InboxControllerApi(client).getInbox(inboxId).execute();
    }
    //</gen>

    //<gen>inbox_docs_list_emails
    public static PageEmailPreview listEmails(ApiClient client, UUID inboxId,
                                              int page) throws ApiException {
        return new InboxControllerApi(client).getInboxEmailsPaginated(inboxId)
            .page(page).size(20).sort("DESC").execute();
    }
    //</gen>

    //<gen>inbox_docs_get_email
    public static Email getEmail(ApiClient client, UUID emailId) throws ApiException {
        return new EmailControllerApi(client).getEmail(emailId).execute();
    }
    //</gen>

    //<gen>inbox_docs_delete_inbox
    public static void deleteInbox(ApiClient client, UUID disposableInboxId) throws ApiException {
        // Call only after exporting anything needed and removing references to this inbox.
        new InboxControllerApi(client).deleteInbox(disposableInboxId).execute();
    }
    //</gen>

    //<gen>inbox_docs_webhook
    public static WebhookDto webhook(ApiClient client, UUID inboxId,
                                      String receiverUrl) throws ApiException {
        // receiverUrl is your HTTPS endpoint; validate signatures and handle retries there.
        if (!receiverUrl.startsWith("https://")) {
            throw new IllegalArgumentException("Use an HTTPS webhook receiver");
        }
        return new WebhookControllerApi(client).createWebhook(inboxId,
            new CreateWebhookOptions().url(receiverUrl)
                .eventName(CreateWebhookOptions.EventNameEnum.EMAIL_RECEIVED)).execute();
    }
    //</gen>

    //<gen>inbox_docs_access
    public static ImapSmtpAccessDetails access(ApiClient client, UUID inboxId) throws ApiException {
        // Contains passwords. Keep the result private; never log or serialize it into reports.
        return new InboxControllerApi(client).getImapSmtpAccess().inboxId(inboxId).execute();
    }
    //</gen>

    //<gen>inbox_docs_wait_latest
    public static Email waitLatest(ApiClient client, UUID inboxId, OffsetDateTime receivedSince)
            throws ApiException {
        // Record receivedSince before triggering the application; use an isolated inbox.
        return new WaitForControllerApi(client).waitForLatestEmail()
            .inboxId(inboxId).timeout(60_000L).since(receivedSince).unreadOnly(true).execute();
    }
    //</gen>

    //<gen>inbox_docs_wait_matching
    public static Email waitMatching(ApiClient client, UUID inboxId, String fullRecipient,
                                      String subjectFragment, OffsetDateTime receivedSince)
            throws ApiException {
        // Record receivedSince before triggering this attempt; use a unique subject fragment.
        MatchOptions matches = new MatchOptions().addMatchesItem(new MatchOption()
            .field(MatchOption.FieldEnum.TO).should(MatchOption.ShouldEnum.CONTAIN)
            .value(fullRecipient)).addMatchesItem(new MatchOption()
            .field(MatchOption.FieldEnum.SUBJECT).should(MatchOption.ShouldEnum.CONTAIN)
            .value(subjectFragment));
        return new WaitForControllerApi(client).waitForMatchingFirstEmail(inboxId, matches)
            .timeout(60_000L).since(receivedSince).unreadOnly(true).execute();
    }
    //</gen>

    //<gen>inbox_docs_imap_tls
    public static int imapTls(ApiClient client, UUID inboxId) throws Exception {
        ImapSmtpAccessDetails access = new InboxControllerApi(client)
            .getImapSmtpAccess().inboxId(inboxId).execute();
        Properties properties = new Properties();
        properties.setProperty("mail.imaps.ssl.checkserveridentity", "true");
        properties.setProperty("mail.imaps.connectiontimeout", "10000");
        properties.setProperty("mail.imaps.timeout", "30000");
        Session session = Session.getInstance(properties);
        try (Store store = session.getStore("imaps")) {
            store.connect(access.getSecureImapServerHost(), access.getSecureImapServerPort(),
                access.getSecureImapUsername(), access.getSecureImapPassword());
            Folder folder = store.getFolder(access.getImapMailbox());
            try {
                folder.open(Folder.READ_ONLY);
                return folder.getMessageCount();
            } finally {
                if (folder.isOpen()) folder.close(false);
            }
        }
    }
    //</gen>
}
