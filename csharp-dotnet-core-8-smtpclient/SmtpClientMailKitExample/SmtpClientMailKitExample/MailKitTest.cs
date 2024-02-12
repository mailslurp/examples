//<gen>csharp_mailkit_import
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;
//</gen>

namespace SmtpClientMailKitExample;

public class TestsMailKit
{
    [Test]
    public async Task Test_CanCreateInboxAndSend_MailKit()
    {
        var YOUR_API_KEY = Environment.GetEnvironmentVariable("API_KEY");
        Assert.That(YOUR_API_KEY, Is.Not.Null);
        //<gen>csharp_mailkit_configure_mailslurp
        var config = new Configuration();
        config.ApiKey.Add("x-api-key", YOUR_API_KEY);
        //</gen>
        //<gen>csharp_mailkit_create_inbox
        var inboxController = new InboxControllerApi(config);
        var inbox = await inboxController.CreateInboxWithOptionsAsync(new CreateInboxDto
        {
            InboxType = CreateInboxDto.InboxTypeEnum.SMTPINBOX,
            Name = "My test inbox",
        });
        var accessDetails = await inboxController.GetImapSmtpAccessAsync(inbox.Id);
        //</gen>
        Assert.That(inbox.InboxType, Is.EqualTo(InboxDto.InboxTypeEnum.SMTPINBOX));
        //<gen>csharp_mailkit_configure_message
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(name: inbox.Name, address: inbox.EmailAddress));
        message.To.Add(new MailboxAddress(name: inbox.Name, address: inbox.EmailAddress));
        message.Subject = "Test Email";
        message.Body = new TextPart("plain")
        {
            Text = @"Hello World!"
        };
        //</gen>
        //<gen>csharp_mailkit_configure_smtpclient_send
        using (var client = new SmtpClient())
        {
            await client.ConnectAsync(host: accessDetails.SecureSmtpServerHost , port: accessDetails.SecureSmtpServerPort, SecureSocketOptions.StartTls);
            // Remove other authentication mechanisms except for PLAIN
            client.AuthenticationMechanisms.Remove("XOAUTH2");
            client.AuthenticationMechanisms.Remove("CRAM-MD5");
            client.AuthenticationMechanisms.Remove("LOGIN");
            await client.AuthenticateAsync(userName: accessDetails.SecureSmtpUsername, password: accessDetails.SecureSmtpPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        //</gen>
        //<gen>csharp_mailkit_configure_receive
        var waitForControllerApi = new WaitForControllerApi(config);
        var email = await waitForControllerApi.WaitForLatestEmailAsync(inbox.Id, 120000, true);
        //</gen>
        Assert.That(email.Body, Does.Contain("Hello World!"));
        //<gen>csharp_mailkit_mailslurp_send
        var sent = await inboxController.SendEmailAndConfirmAsync(inbox.Id, new SendEmailOptions(
            to: [inbox.EmailAddress],
            subject: "Hello",
            body: "Testing",
            validateEmailAddresses: SendEmailOptions.ValidateEmailAddressesEnum.VALIDATEERRORIFINVALID
        ));
        Assert.That(sent.To, Does.Contain(inbox.EmailAddress));
        //</gen>
        //<gen>csharp_mailkit_mailslurp_verify
        var verificationControllerApi = new EmailVerificationControllerApi(config);
        var results =await verificationControllerApi.ValidateEmailAddressListAsync(new ValidateEmailAddressListOptions(["contact@mailslurp.dev"]) );
        //</gen>
        Assert.That(results.ValidEmailAddresses, Does.Contain("contact@mailslurp.dev"));
        
    }
}