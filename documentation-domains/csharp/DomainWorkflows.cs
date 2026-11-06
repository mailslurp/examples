//<gen>domains_docs_setup
using System;
using System.Collections.Generic;
using System.Linq;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

public static class DomainSetup
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
public static class DomainWorkflows
{
    //<gen>domains_docs_create
    public static DomainDto AddDomain(Configuration configuration, string domain)
    {
        // Add a domain you control, for example test.example.com. Next, publish its DNS records.
        return new DomainControllerApi(configuration).CreateDomain(new CreateDomainOptions(
            domain: domain, description: "QA mail domain", createdCatchAllInbox: true));
    }
    //</gen>

    //<gen>domains_docs_dns_records
    public static List<string> DnsRecords(Configuration configuration, Guid domainId)
    {
        // Add each record at your DNS provider. Required records must exist before verification passes.
        return new DomainControllerApi(configuration).GetDomain(domainId).DomainNameRecords
            .Select(record => $"{record.RecordType} {record.Name} {string.Join(" ", record.RecordEntries)}")
            .ToList();
    }
    //</gen>

    //<gen>domains_docs_check_verified
    public static bool CheckVerified(Configuration configuration, Guid domainId)
    {
        // Verification runs automatically after DNS propagates; read the status and any missing records.
        var domain = new DomainControllerApi(configuration).GetDomain(domainId);
        if (!domain.IsVerified) Console.WriteLine(domain.MissingRecordsMessage);
        return domain.IsVerified;
    }
    //</gen>

    //<gen>domains_docs_list
    public static List<string> ListDomains(Configuration configuration)
    {
        return new DomainControllerApi(configuration).GetDomains()
            .Select(domain => $"{domain.Domain} verified={domain.IsVerified}")
            .ToList();
    }
    //</gen>

    //<gen>domains_docs_create_inbox
    public static InboxDto CreateInboxOnDomain(Configuration configuration, string domain)
    {
        // Once verified, create addresses on the domain, such as support@your-domain.
        return new InboxControllerApi(configuration).CreateInboxWithOptions(
            new CreateInboxDto(emailAddress: $"support@{domain}", name: "Support tests"));
    }
    //</gen>
}
