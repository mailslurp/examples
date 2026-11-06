//<gen>placement_docs_setup
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

final class PlacementSetup {
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
public final class InboxPlacementWorkflows {
    private InboxPlacementWorkflows() {}

    //<gen>placement_docs_create_test
    public static InboxPlacementTestRunDto createTest(ApiClient client, String senderDomain, String fromEmail) throws ApiException {
        // A test gives you seed addresses at Gmail, Outlook, Yahoo and other providers, and a
        // tracking token that the campaign you send must include.
        return new ApiInboxPlacementTestControllerApi(client).createInboxPlacementTest(new CreateInboxPlacementTestOptions()
            .requestedSegment(CreateInboxPlacementTestOptions.RequestedSegmentEnum.ALL_INBOXES)
            .senderDomain(senderDomain)
            .fromEmail(fromEmail)
            .publicShareRequested(false)
            .addressFormat(CreateInboxPlacementTestOptions.AddressFormatEnum.COMMA)).execute();
    }
    //</gen>

    //<gen>placement_docs_send_to_seeds
    public static void sendToSeeds(ApiClient client, UUID senderInboxId, InboxPlacementTestRunDto test) throws ApiException {
        // Send your real campaign to every seed address with the test's tracking token in the subject.
        // In production, send through your own ESP from the domain you are testing; a MailSlurp inbox
        // is used here to keep the example short.
        new InboxControllerApi(client).sendEmail(senderInboxId, new SendEmailOptions()
            .to(test.getSeedAddresses())
            .subject("Spring sale: 20% off everything " + test.getTrackingToken())
            .body("<h1>Spring sale</h1><p>20% off everything this week.</p>")
            .isHTML(true)).execute();
        // Confirm only after the send succeeded, so MailSlurp starts watching the seed inboxes.
        new ApiInboxPlacementTestControllerApi(client).confirmInboxPlacementTestSent(test.getId()).execute();
    }
    //</gen>

    //<gen>placement_docs_wait_results
    public static InboxPlacementTestRunDto waitForResults(ApiClient client, UUID testId) throws Exception {
        // Seeds report as messages arrive; poll until the test completes (usually a few minutes).
        ApiInboxPlacementTestControllerApi placement = new ApiInboxPlacementTestControllerApi(client);
        for (int attempt = 0; attempt < 40; attempt++) {
            InboxPlacementTestRunDto run = placement.getInboxPlacementTest(testId).execute();
            if (run.getCompletedAt() != null) {
                System.out.println("Inbox " + run.getInboxTargets() + ", spam " + run.getSpamTargets()
                    + ", missing " + run.getNotReceivedTargets());
                return run;
            }
            Thread.sleep(15_000);
        }
        throw new IllegalStateException("Inbox placement test " + testId + " is still running");
    }
    //</gen>

    //<gen>placement_docs_by_provider
    public static Map<String, Map<String, Integer>> placementByProvider(ApiClient client, UUID testId) throws ApiException {
        // Count where each provider put the email: INBOX, SPAM or not received.
        InboxPlacementRemoteResultsDto results = new ApiInboxPlacementTestControllerApi(client)
            .getInboxPlacementTestResults(testId).execute().getResults();
        Map<String, Map<String, Integer>> byProvider = new HashMap<>();
        if (results == null) return byProvider;
        for (InboxPlacementTargetResultDto target : results.getTargets()) {
            String folder = target.getPlacementFolder() == null ? "NOT_RECEIVED" : target.getPlacementFolder();
            byProvider.computeIfAbsent(target.getProvider(), key -> new HashMap<>()).merge(folder, 1, Integer::sum);
        }
        return byProvider;
    }
    //</gen>
}
