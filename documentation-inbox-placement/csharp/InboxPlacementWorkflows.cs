//<gen>placement_docs_setup
// The inbox placement endpoints are newer than the current NuGet SDK, so these helpers call the
// REST API with HttpClient. Sending uses the MailSlurp SDK. Both use your x-api-key.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

public static class PlacementSetup
{
    public static HttpClient CreateHttpClient()
    {
        var http = new HttpClient { BaseAddress = new Uri("https://api.mailslurp.com"), Timeout = TimeSpan.FromSeconds(75) };
        http.DefaultRequestHeaders.Add("x-api-key", ApiKey());
        return http;
    }

    public static Configuration CreateConfiguration()
    {
        var configuration = new Configuration { Timeout = TimeSpan.FromSeconds(75) };
        configuration.ApiKey.Add("x-api-key", ApiKey());
        return configuration;
    }

    private static string ApiKey()
    {
        var apiKey = Environment.GetEnvironmentVariable("MAILSLURP_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Set MAILSLURP_API_KEY");
        return apiKey;
    }
}
//</gen>

// Independent helpers: building this library makes no requests.
public static class InboxPlacementWorkflows
{
    //<gen>placement_docs_create_test
    public static async Task<(string TestId, List<string> SeedAddresses)> CreateTest(
        HttpClient http, string senderDomain, string fromEmail)
    {
        // A test gives you seed addresses at Gmail, Outlook, Yahoo and other providers.
        var response = await http.PostAsJsonAsync("/inbox-placement-tests", new
        {
            requestedSegment = "ALL_INBOXES",
            senderDomain,
            fromEmail,
            publicShareRequested = false,
            addressFormat = "COMMA",
        });
        response.EnsureSuccessStatusCode();
        var run = await response.Content.ReadFromJsonAsync<JsonElement>();
        var seeds = run.GetProperty("seedAddresses").EnumerateArray().Select(seed => seed.GetString()).ToList();
        return (run.GetProperty("id").GetString(), seeds);
    }
    //</gen>

    //<gen>placement_docs_send_to_seeds
    public static void SendToSeeds(Configuration configuration, Guid senderInboxId, List<string> seedAddresses)
    {
        // Send your real campaign to the seed addresses. In production, send through your own ESP
        // from the domain you are testing; a MailSlurp inbox is used here to keep the example short.
        new InboxControllerApi(configuration).SendEmail(senderInboxId, new SendEmailOptions(
            to: seedAddresses,
            subject: "Spring sale: 20% off everything",
            body: "<h1>Spring sale</h1><p>20% off everything this week.</p>",
            isHTML: true));
    }
    //</gen>

    //<gen>placement_docs_wait_results
    public static async Task<JsonElement> WaitForResults(HttpClient http, string testId)
    {
        // Seeds report as messages arrive; poll until the test completes (usually a few minutes).
        for (var attempt = 0; attempt < 40; attempt++)
        {
            var run = await http.GetFromJsonAsync<JsonElement>($"/inbox-placement-tests/{testId}");
            if (run.TryGetProperty("completedAt", out var completedAt) && completedAt.ValueKind != JsonValueKind.Null)
            {
                Console.WriteLine($"Inbox {run.GetProperty("inboxTargets")}, spam {run.GetProperty("spamTargets")}, " +
                                  $"missing {run.GetProperty("notReceivedTargets")}");
                return run;
            }
            await Task.Delay(TimeSpan.FromSeconds(15));
        }
        throw new TimeoutException($"Inbox placement test {testId} is still running");
    }
    //</gen>

    //<gen>placement_docs_by_provider
    public static async Task<Dictionary<string, Dictionary<string, int>>> PlacementByProvider(HttpClient http, string testId)
    {
        // Count where each provider put the email: INBOX, SPAM or not received.
        var response = await http.GetFromJsonAsync<JsonElement>($"/inbox-placement-tests/{testId}/results");
        var byProvider = new Dictionary<string, Dictionary<string, int>>();
        if (!response.TryGetProperty("results", out var results) || results.ValueKind == JsonValueKind.Null) return byProvider;
        foreach (var target in results.GetProperty("targets").EnumerateArray())
        {
            var provider = target.GetProperty("provider").GetString();
            var folder = target.TryGetProperty("placementFolder", out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString() : "NOT_RECEIVED";
            if (!byProvider.TryGetValue(provider, out var counts)) byProvider[provider] = counts = new Dictionary<string, int>();
            counts[folder] = counts.TryGetValue(folder, out var count) ? count + 1 : 1;
        }
        return byProvider;
    }
    //</gen>
}
