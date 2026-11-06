//<gen>webhooks_docs_setup
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

final class WebhookSetup {
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
public final class WebhookWorkflows {
    private WebhookWorkflows() {}

    //<gen>webhooks_docs_create
    public static WebhookDto createWebhook(ApiClient client, UUID inboxId, String url) throws ApiException {
        // MailSlurp POSTs a JSON payload to `url` each time this inbox receives an email.
        return new WebhookControllerApi(client).createWebhook(inboxId, new CreateWebhookOptions()
            .url(url)
            .name("New order emails")
            .eventName(CreateWebhookOptions.EventNameEnum.NEW_EMAIL)).execute();
    }
    //</gen>

    //<gen>webhooks_docs_list
    public static List<String> listWebhooks(ApiClient client, UUID inboxId) throws ApiException {
        return new WebhookControllerApi(client).getAllWebhooks().inboxId(inboxId).size(20).execute()
            .getContent().stream()
            .map(webhook -> webhook.getId() + " " + webhook.getUrl() + " " + webhook.getEventName())
            .collect(Collectors.toList());
    }
    //</gen>

    //<gen>webhooks_docs_test
    public static Integer sendTest(ApiClient client, UUID webhookId) throws ApiException {
        // Sends a sample payload to your endpoint and returns the response it gave.
        WebhookTestResult result = new WebhookControllerApi(client).sendTestData(webhookId).execute();
        return result.getResponse().getStatusCode();
    }
    //</gen>

    //<gen>webhooks_docs_verify
    public static boolean verifySignature(ApiClient client, Map<String, String> headers) throws ApiException {
        // In your webhook handler, pass the x-message-id and x-signature request headers.
        VerifyWebhookSignatureResults result = new WebhookControllerApi(client).verifyWebhookSignature(
            new VerifyWebhookSignatureOptions()
                .messageId(headers.get("x-message-id"))
                .signature(headers.get("x-signature"))).execute();
        return Boolean.TRUE.equals(result.getIsValid());
    }
    //</gen>

    //<gen>webhooks_docs_delete
    public static void deleteWebhook(ApiClient client, UUID webhookId) throws ApiException {
        new WebhookControllerApi(client).deleteWebhookById(webhookId).execute();
    }
    //</gen>
}
