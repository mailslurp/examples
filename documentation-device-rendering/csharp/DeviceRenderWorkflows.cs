//<gen>render_docs_setup
// The device rendering endpoints are newer than the current NuGet SDK, so these helpers call the
// REST API directly with HttpClient. Every request sends your API key in the x-api-key header.
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

public static class RenderSetup
{
    public static HttpClient CreateClient()
    {
        var apiKey = Environment.GetEnvironmentVariable("MAILSLURP_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Set MAILSLURP_API_KEY");
        var http = new HttpClient { BaseAddress = new Uri("https://api.mailslurp.com"), Timeout = TimeSpan.FromSeconds(150) };
        http.DefaultRequestHeaders.Add("x-api-key", apiKey);
        return http;
    }
}
//</gen>

// Independent helpers: building this library makes no requests.
public static class DeviceRenderWorkflows
{
    //<gen>render_docs_list_targets
    public static async Task<List<string>> ListTargets(HttpClient http)
    {
        // Each target is one email client on one device, for example ios_mail_physical_device.
        var availability = await http.GetFromJsonAsync<JsonElement>("/emails/device-previews/native-targets/availability");
        return availability.GetProperty("targets").EnumerateArray()
            .Where(target => target.GetProperty("enabled").GetBoolean())
            .Select(target => $"{target.GetProperty("target")} ({target.GetProperty("client")}, {target.GetProperty("platform")})")
            .ToList();
    }
    //</gen>

    //<gen>render_docs_create_from_html
    public static async Task<string> RenderHtml(HttpClient http, string html)
    {
        // Render HTML directly, without sending it to an inbox first. Returns the run ID.
        var response = await http.PostAsJsonAsync("/emails/device-previews/import/html", new
        {
            html,
            subject = "Spring sale preview",
            options = new { targets = new[] { "gmail_chromium_web", "ios_mail_physical_device" } },
        });
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("run").GetProperty("runId").GetString();
    }
    //</gen>

    //<gen>render_docs_create_from_email
    public static async Task<string> RenderEmail(HttpClient http, Guid emailId)
    {
        // Render an email already received by a MailSlurp inbox, for example from your ESP.
        var response = await http.PostAsJsonAsync($"/emails/{emailId}/device-previews", new { allTargets = true });
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("run").GetProperty("runId").GetString();
    }
    //</gen>

    //<gen>render_docs_wait
    public static async Task<JsonElement> WaitForRun(HttpClient http, string runId)
    {
        // Each call waits on the server for up to 60 seconds, so wait in rounds.
        for (var round = 0; round < 5; round++)
        {
            var result = await http.GetFromJsonAsync<JsonElement>(
                $"/emails/device-previews/{runId}/wait?timeoutMillis=60000&pollIntervalMillis=5000");
            if (!result.GetProperty("timedOut").GetBoolean()) return result.GetProperty("run");
        }
        throw new TimeoutException($"Render {runId} is still running after 5 minutes");
    }
    //</gen>

    //<gen>render_docs_screenshots
    public static async Task<List<string>> Screenshots(HttpClient http, string runId)
    {
        var results = await http.GetFromJsonAsync<JsonElement>($"/emails/device-previews/{runId}/results");
        // accessUrl is an authenticated image URL for each captured screenshot.
        return results.GetProperty("screenshots").EnumerateArray()
            .Select(shot => $"{shot.GetProperty("title")}: {shot.GetProperty("accessUrl")}")
            .ToList();
    }
    //</gen>
}
