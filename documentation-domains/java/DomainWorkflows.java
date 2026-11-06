//<gen>domains_docs_setup
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

final class DomainSetup {
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
public final class DomainWorkflows {
    private DomainWorkflows() {}

    //<gen>domains_docs_create
    public static DomainDto addDomain(ApiClient client, String domain) throws ApiException {
        // Add a domain you control, for example test.example.com. Next, publish its DNS records.
        return new DomainControllerApi(client).createDomain(new CreateDomainOptions()
            .domain(domain)
            .description("QA mail domain")
            .createdCatchAllInbox(true)).execute();
    }
    //</gen>

    //<gen>domains_docs_dns_records
    public static List<String> dnsRecords(ApiClient client, UUID domainId) throws ApiException {
        // Add each record at your DNS provider. Required records must exist before verification passes.
        return new DomainControllerApi(client).getDomain(domainId).execute().getDomainNameRecords().stream()
            .map(record -> record.getRecordType() + " " + record.getName() + " " + record.getRecordEntries())
            .collect(Collectors.toList());
    }
    //</gen>

    //<gen>domains_docs_check_verified
    public static boolean checkVerified(ApiClient client, UUID domainId) throws ApiException {
        // Verification runs automatically after DNS propagates; read the status and any missing records.
        DomainDto domain = new DomainControllerApi(client).getDomain(domainId).execute();
        if (!Boolean.TRUE.equals(domain.getIsVerified())) System.out.println(domain.getMissingRecordsMessage());
        return Boolean.TRUE.equals(domain.getIsVerified());
    }
    //</gen>

    //<gen>domains_docs_list
    public static List<String> listDomains(ApiClient client) throws ApiException {
        return new DomainControllerApi(client).getDomains().execute().stream()
            .map(domain -> domain.getDomain() + " verified=" + domain.getIsVerified())
            .collect(Collectors.toList());
    }
    //</gen>

    //<gen>domains_docs_create_inbox
    public static InboxDto createInboxOnDomain(ApiClient client, String domain) throws ApiException {
        // Once verified, create addresses on the domain, such as support@your-domain.
        return new InboxControllerApi(client).createInboxWithOptions(new CreateInboxDto()
            .emailAddress("support@" + domain)
            .name("Support tests")).execute();
    }
    //</gen>
}
