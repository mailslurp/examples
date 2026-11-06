//<gen>webhooks_docs_setup
using System;
using System.Collections.Generic;
using System.Linq;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

public static class WebhookSetup
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
public static class WebhookWorkflows
{
    //<gen>webhooks_docs_create
    public static WebhookDto CreateWebhook(Configuration configuration, Guid inboxId, string url)
    {
        // MailSlurp POSTs a JSON payload to `url` each time this inbox receives an email.
        return new WebhookControllerApi(configuration).CreateWebhook(inboxId, new CreateWebhookOptions(
            url: url, name: "New order emails", eventName: CreateWebhookOptions.EventNameEnum.NEWEMAIL));
    }
    //</gen>

    //<gen>webhooks_docs_list
    public static List<string> ListWebhooks(Configuration configuration, Guid inboxId)
    {
        return new WebhookControllerApi(configuration).GetAllWebhooks(inboxId: inboxId, size: 20).Content
            .Select(webhook => $"{webhook.Id} {webhook.Url} {webhook.EventName}")
            .ToList();
    }
    //</gen>

    //<gen>webhooks_docs_test
    public static int? SendTest(Configuration configuration, Guid webhookId)
    {
        // Sends a sample payload to your endpoint and returns the response it gave.
        var result = new WebhookControllerApi(configuration).SendTestData(webhookId);
        return result.Response.StatusCode;
    }
    //</gen>

    //<gen>webhooks_docs_verify
    public static bool VerifySignature(Configuration configuration, IDictionary<string, string> headers)
    {
        // In your webhook handler, pass the x-message-id and x-signature request headers.
        var result = new WebhookControllerApi(configuration).VerifyWebhookSignature(
            new VerifyWebhookSignatureOptions(messageId: headers["x-message-id"], signature: headers["x-signature"]));
        return result.IsValid;
    }
    //</gen>

    //<gen>webhooks_docs_delete
    public static void DeleteWebhook(Configuration configuration, Guid webhookId)
    {
        new WebhookControllerApi(configuration).DeleteWebhookById(webhookId);
    }
    //</gen>
}
