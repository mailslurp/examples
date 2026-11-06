//<gen>render_docs_setup
import com.mailslurp.apis.*;
import com.mailslurp.clients.ApiClient;
import com.mailslurp.clients.ApiException;
import com.mailslurp.models.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

final class RenderSetup {
    static ApiClient createClient() {
        String apiKey = System.getenv("MAILSLURP_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Set MAILSLURP_API_KEY");
        }
        ApiClient client = new ApiClient();
        client.setApiKey(apiKey);
        client.setConnectTimeout(10_000);
        client.setReadTimeout(150_000);
        return client;
    }
}
//</gen>

/** Independent examples. No main method: loading or compiling this file makes no requests. */
public final class DeviceRenderWorkflows {
    private DeviceRenderWorkflows() {}

    //<gen>render_docs_list_targets
    public static List<String> listTargets(ApiClient client) throws ApiException {
        // Each target is one email client on one device, for example ios_mail_physical_device.
        return new DevicePreviewsControllerApi(client).getDevicePreviewNativeTargetAvailability().execute()
            .getTargets().stream()
            .filter(target -> Boolean.TRUE.equals(target.getEnabled()))
            .map(target -> target.getTarget() + " (" + target.getClient() + ", " + target.getPlatform() + ")")
            .collect(Collectors.toList());
    }
    //</gen>

    //<gen>render_docs_create_from_html
    public static DevicePreviewRunDto renderHtml(ApiClient client, String html) throws ApiException {
        // Render HTML directly, without sending it to an inbox first.
        return new DevicePreviewsControllerApi(client).createDevicePreviewRunFromHtmlImport(
            new CreateDevicePreviewHtmlImportOptions()
                .html(html)
                .subject("Spring sale preview")
                .options(new CreateDevicePreviewOptions()
                    .targets(Arrays.asList("gmail_chromium_web", "ios_mail_physical_device")))).execute().getRun();
    }
    //</gen>

    //<gen>render_docs_create_from_email
    public static DevicePreviewRunDto renderEmail(ApiClient client, UUID emailId) throws ApiException {
        // Render an email already received by a MailSlurp inbox, for example from your ESP.
        return new DevicePreviewsControllerApi(client).createDevicePreviewRun(emailId)
            .createDevicePreviewOptions(new CreateDevicePreviewOptions().allTargets(true)).execute().getRun();
    }
    //</gen>

    //<gen>render_docs_wait
    public static DevicePreviewRunDto waitForRun(ApiClient client, UUID runId) throws ApiException {
        // Each call waits on the server for up to 60 seconds, so wait in rounds.
        DevicePreviewsControllerApi previews = new DevicePreviewsControllerApi(client);
        for (int round = 0; round < 5; round++) {
            DevicePreviewRunWaitResult result = previews.waitForDevicePreviewRun(runId)
                .timeoutMillis(60_000L).pollIntervalMillis(5_000L).execute();
            if (!Boolean.TRUE.equals(result.getTimedOut())) return result.getRun();
        }
        throw new IllegalStateException("Render " + runId + " is still running after 5 minutes");
    }
    //</gen>

    //<gen>render_docs_screenshots
    public static List<String> screenshots(ApiClient client, UUID runId) throws ApiException {
        DevicePreviewRunResultsDto results = new DevicePreviewsControllerApi(client)
            .getDevicePreviewRunResults(runId).execute();
        // getAccessUrl is an authenticated image URL for each captured screenshot.
        return results.getScreenshots().stream()
            .map(shot -> shot.getTitle() + ": " + shot.getAccessUrl())
            .collect(Collectors.toList());
    }
    //</gen>
}
