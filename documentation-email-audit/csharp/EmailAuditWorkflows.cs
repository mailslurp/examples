//<gen>audit_docs_setup
using System;
using System.Collections.Generic;
using System.Linq;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

public static class AuditSetup
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
public static class EmailAuditWorkflows
{
    //<gen>audit_docs_audit_html
    public static EmailAuditDto AuditHtml(Configuration configuration, string html)
    {
        // Checks links, images, spelling and content before you send the campaign.
        var audit = new EmailAuditControllerApi(configuration).CreateEmailAudit(new CreateEmailAuditOptions(
            subject: "Spring sale: 20% off", fromAddress: "news@example.com", htmlBody: html));
        Console.WriteLine($"Health score {audit.Analysis.HealthScore}, failing checks {audit.Analysis.FailingChecks}");
        return audit;
    }
    //</gen>

    //<gen>audit_docs_read_issues
    public static List<string> ReadIssues(Configuration configuration, Guid auditId)
    {
        var analysis = new EmailAuditControllerApi(configuration).GetEmailAudit(auditId).Analysis;
        var issues = analysis.BrokenLinks.Select(issue => $"Broken link: {issue.Url}").ToList();
        issues.AddRange(analysis.BrokenImages.Select(issue => $"Broken image: {issue.Url}"));
        issues.AddRange(analysis.SpellingIssues.Select(issue => $"Spelling: {issue.Message}"));
        return issues;
    }
    //</gen>

    //<gen>audit_docs_list
    public static List<string> ListAudits(Configuration configuration)
    {
        return new EmailAuditControllerApi(configuration).GetEmailAudits(limit: 10)
            .Select(audit => $"{audit.Subject} score {audit.Analysis.HealthScore}")
            .ToList();
    }
    //</gen>
}
