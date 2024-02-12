//<gen>csharp_smtpclient_import

using System.Net;
using System.Net.Mail;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

//</gen>

namespace SmtpClientMailKitExample;

public class TestsSmtpClient
{
    [Test]
    public void Test_CanCreateInboxAndSend_SmtpClient()
    {
        var YOUR_API_KEY = Environment.GetEnvironmentVariable("API_KEY");
        Assert.That(YOUR_API_KEY, Is.Not.Null);
        //<gen>csharp_smtpclient_configure_mailslurp
        var config = new Configuration();
        config.ApiKey.Add("x-api-key", YOUR_API_KEY);
        //</gen>
        //<gen>csharp_smtpclient_create_inbox
        var inboxController = new InboxControllerApi(config);
        var inbox = inboxController.CreateInboxWithOptions(new CreateInboxDto
        {
            InboxType = CreateInboxDto.InboxTypeEnum.SMTPINBOX
        });
        var accessDetails = inboxController.GetImapSmtpAccess(inbox.Id);
        //</gen>
        Assert.That(inbox.InboxType, Is.EqualTo(InboxDto.InboxTypeEnum.SMTPINBOX));
        //<gen>csharp_smtpclient_configure_smtpclient
        var client = new SmtpClient
        {
            Port = accessDetails.SecureSmtpServerPort,
            Host = accessDetails.SecureSmtpServerHost,
            EnableSsl = true,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(userName: accessDetails.SecureSmtpUsername, password: accessDetails.SecureSmtpPassword)
        };
        //</gen>
        //<gen>csharp_smtpclient_configure_send
        var mail = new MailMessage()
        {
            From = new MailAddress(inbox.EmailAddress),
            Subject = "This is a test",
            Body = "This is a test email sent from .NET application.",
        };
        mail.To.Add(inbox.EmailAddress);
        client.Send(mail);
        //</gen>
        //<gen>csharp_smtpclient_configure_receive
        var waitForControllerApi = new WaitForControllerApi(config);
        var email = waitForControllerApi.WaitForLatestEmail(inbox.Id, 120000, true);
        //</gen>
        Assert.That(email.Subject, Does.Contain("This is a test"));
    }
}