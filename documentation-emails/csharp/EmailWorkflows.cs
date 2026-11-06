//<gen>emails_docs_setup
using System;
using System.Collections.Generic;
using System.Text;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

public static class EmailSetup
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
public static class EmailWorkflows
{
    //<gen>emails_docs_send_html
    public static SentEmailDto SendHtml(Configuration configuration, Guid inboxId, string to)
    {
        // SendEmailAndConfirm returns the sent email record once MailSlurp accepts it.
        return new InboxControllerApi(configuration).SendEmailAndConfirm(inboxId, new SendEmailOptions(
            to: new List<string> { to },
            subject: "Your order has shipped",
            body: "<h1>On its way</h1><p>Track it at <a href=\"https://example.com/track\">example.com</a></p>",
            isHTML: true));
    }
    //</gen>

    //<gen>emails_docs_send_attachment
    public static SentEmailDto SendAttachment(Configuration configuration, Guid inboxId, string to)
    {
        // Upload the file first, then send its attachment ID with the email.
        var attachmentIds = new AttachmentControllerApi(configuration).UploadAttachment(new UploadAttachmentOptions(
            base64Contents: Convert.ToBase64String(Encoding.UTF8.GetBytes("id,total\n1001,49.00\n")),
            contentType: "text/csv",
            filename: "invoice.csv"));
        return new InboxControllerApi(configuration).SendEmailAndConfirm(inboxId, new SendEmailOptions(
            to: new List<string> { to }, subject: "Invoice attached", body: "See attached.",
            attachments: attachmentIds));
    }
    //</gen>

    //<gen>emails_docs_get_email
    public static Email GetEmail(Configuration configuration, Guid emailId)
    {
        var email = new EmailControllerApi(configuration).GetEmail(emailId);
        Console.WriteLine($"{email.From} {email.Subject}");
        return email;
    }
    //</gen>

    //<gen>emails_docs_links_codes
    public static List<string> LinksAndCode(Configuration configuration, Guid emailId)
    {
        // MailSlurp parses links and one-time codes from the email body for you.
        var emails = new EmailControllerApi(configuration);
        var links = emails.GetEmailLinks(emailId).Links;
        var codes = emails.GetEmailCodes(emailId);
        if (codes.Found) Console.WriteLine($"Code: {codes.Code}");
        return links;
    }
    //</gen>

    //<gen>emails_docs_download_attachment
    public static byte[] DownloadAttachment(Configuration configuration, Guid emailId)
    {
        var email = new EmailControllerApi(configuration).GetEmail(emailId);
        var attachmentId = email.Attachments[0];
        var file = new AttachmentControllerApi(configuration).DownloadAttachmentAsBase64Encoded(attachmentId);
        return Convert.FromBase64String(file.Base64FileContents);
    }
    //</gen>

    //<gen>emails_docs_reply
    public static SentEmailDto Reply(Configuration configuration, Guid emailId)
    {
        // Replies keep the original thread headers and send from the receiving inbox.
        return new EmailControllerApi(configuration).ReplyToEmail(emailId,
            new ReplyToEmailOptions(body: "Thanks, received.", isHTML: false));
    }
    //</gen>
}
