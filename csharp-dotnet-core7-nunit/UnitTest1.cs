using System.Net;
using System.Net.Mail;
using System.Text;

namespace csharp_dotnet_core7_nunit;

//<gen>csharp_demo_import
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

//</gen>

public class Tests
{
    private Configuration _configuration;

    [SetUp]
    public void Setup()
    {
        var YOUR_API_KEY = Environment.GetEnvironmentVariable("API_KEY")!;
        //<gen>csharp_demo_configure
        var configuration = new Configuration();
        configuration.ApiKey.Add("x-api-key", YOUR_API_KEY);
        configuration.Timeout = 120_000;
        //</gen>
        _configuration = configuration;
    }

    [Test]
    public void CreateInstance()
    {
        //<gen>csharp_demo_create_controller
        var apiInstance = new InboxControllerApi(_configuration);
        //</gen>
        Assert.That(apiInstance, Is.Not.Null);
    }

    [Test]
    public void CreateInbox()
    {
        //<gen>csharp_demo_create_inbox
        var inboxController = new InboxControllerApi(_configuration);
        var inbox = inboxController.CreateInboxWithDefaults();
        Assert.That(inbox.EmailAddress, Does.Contain("@mailslurp"));
        //</gen>
        var recipient = inboxController.CreateInboxWithDefaults();
        //<gen>csharp_demo_upload_attachment
        var attachmentController = new AttachmentControllerApi(_configuration);
        var uploadOptions = new UploadAttachmentOptions(
            contentType: "text/plain",
            filename: "test.txt",
            base64Contents: Convert.ToBase64String("hello world"u8.ToArray())
        );
        var attachmentIds = attachmentController.UploadAttachment(uploadOptions);
        //</gen>
        //<gen>csharp_demo_send_email
        var sendEmailOptions = new SendEmailOptions
        {
            To = new List<string>() { recipient.EmailAddress },
            Subject = "Hello friend",
            Body = "<h1>MailSlurp supports HTML</h1>",
            Attachments = attachmentIds,
            UseInboxName = true
        };
        var sentEmail = inboxController.SendEmailAndConfirm(inbox.Id, sendEmailOptions);
        Assert.That(sentEmail.Subject, Does.Contain("Hello"));
        //</gen>
        //<gen>csharp_demo_receive_email
        var inboxId = recipient.Id;
        var waitForController = new WaitForControllerApi(_configuration);
        var email = waitForController.WaitForLatestEmail(inboxId: inboxId, timeout: 60_000, unreadOnly: true);
        Assert.That(email.Body, Does.Contain("MailSlurp supports HTML"));
        //</gen>
        //<gen>csharp_demo_fetch_email
        var emailController = new EmailControllerApi(_configuration);
        var fullEmail = emailController.GetEmail(email.Id);
        Assert.That(fullEmail.Attachments, Has.Count.EqualTo(1));
        //</gen>
        var sender = inbox.EmailAddress!;
        Assert.That(sender, Is.Not.Null);

        //<gen>csharp_demo_match_emails
        var matchOptions = new MatchOptions(
            conditions: new List<ConditionOption>
            {
                new(
                    condition: ConditionOption.ConditionEnum.HASATTACHMENTS,
                    value: ConditionOption.ValueEnum.TRUE
                )
            },
            matches: new List<MatchOption>
            {
                new(
                    field: MatchOption.FieldEnum.FROM,
                    should: MatchOption.ShouldEnum.EQUAL,
                    value: sender
                )
            });
        var matchingEmails = waitForController.WaitForMatchingEmails(inboxId: inboxId, timeout: 60_000, count: 1,
            matchOptions: matchOptions);
        Assert.That(matchingEmails.First().Subject, Does.Contain("Hello"));
        //</gen>
    }

    [Test]
    public void VerifyEmail()
    {
        //<gen>csharp_demo_verify_email
        var verificationController = new EmailVerificationControllerApi(_configuration);
        var emails = new List<string>
        {
            "contact@mailslurp.dev",
            "bad@mailslurp.dev"
        };
        var result = verificationController.ValidateEmailAddressList(new ValidateEmailAddressListOptions(emails));
        Assert.Multiple(() =>
        {
            Assert.That(result.InvalidEmailAddresses, Does.Contain("bad@mailslurp.dev"));
            Assert.That(result.ValidEmailAddresses, Does.Contain("contact@mailslurp.dev"));
        });
        //</gen>
    }

    [Test]
    public void CreateAliasWithContact()
    {
        //<gen>csharp_demo_create_aliases
        // create test inboxes
        var inboxController = new InboxControllerApi(_configuration);
        var inbox1 = inboxController.CreateInboxWithDefaults();
        var inbox2 = inboxController.CreateInboxWithDefaults();
        Assert.That(inbox1.EmailAddress, Is.Not.Null);
        Assert.That(inbox2.EmailAddress, Is.Not.Null);
        // create contact
        var contactController = new ContactControllerApi(_configuration);
        var contact = contactController.CreateContact(new CreateContactOptions()
        {
            EmailAddresses = new List<string>() { inbox2.EmailAddress },
            Company = "test-company",
            FirstName = "test-firstname",
            LastName = "test-lastname"
        });
        Assert.That(contact.PrimaryEmailAddress.Contains(inbox2.EmailAddress), Is.True);
        // create alias
        var aliasController = new AliasControllerApi(_configuration);
        var alias = aliasController.CreateAlias(new CreateAliasOptions(inbox2.EmailAddress));
        Assert.That(alias.IsVerified, Is.True);
        Assert.That(alias.MaskedEmailAddress.Contains(inbox2.EmailAddress), Is.True);
        // now email the alias
        var sent = inboxController.SendEmailAndConfirm(inbox1.Id, new SendEmailOptions()
        {
            To = new List<string>() {alias.EmailAddress},
            Subject = "test-alias"
        });
        Assert.That(sent.From.Contains(inbox1.EmailAddress), Is.True);
        Assert.That(sent.To.Contains(alias.EmailAddress), Is.True);
        // now wait for email to arrive
        var waitForController = new WaitForControllerApi(_configuration);
        var latestEmail = waitForController.WaitForLatestEmail(alias.InboxId, 120_000, true);
        Assert.That(latestEmail.Subject.Contains("test-alias"), Is.True);
        //</gen>
    }

    [Test]
    public void CreateInboxWithOptions()
    {
        var inboxController = new InboxControllerApi(_configuration);
        //<gen>csharp_demo_create_inbox_options
        var options = new CreateInboxDto(
            name: "Test inbox",
            inboxType: CreateInboxDto.InboxTypeEnum.SMTPINBOX
        );
        var inbox = inboxController.CreateInboxWithOptions(options);
        Assert.That(inbox.EmailAddress.Contains("@mailslurp"), Is.True);
        //</gen>
        //<gen>csharp_demo_get_inbox
        // get by id
        var inboxDto = inboxController.GetInbox(inbox.Id);
        // get by name
        var inboxByName = inboxController.GetInboxByName(inboxDto.Name);
        Assert.That(inboxByName.Exists, Is.True);
        // get by email address
        var inboxByEmailAddress = inboxController.GetInboxByEmailAddress(inboxDto.EmailAddress);
        Assert.That(inboxByEmailAddress.Exists, Is.True);
        //</gen>
        //<gen>csharp_demo_get_access
        var imapSmtpAccess = inboxController.GetImapSmtpAccess(inbox.Id);
        Assert.Multiple(() =>
        {
            Assert.That(imapSmtpAccess.SecureSmtpServerHost, Is.Not.Null);
            Assert.That(imapSmtpAccess.SecureSmtpServerPort, Is.GreaterThan(0));
            Assert.That(imapSmtpAccess.SecureSmtpUsername, Is.Not.Null);
            Assert.That(imapSmtpAccess.SecureSmtpPassword, Is.Not.Null);
        });
        //</gen>
        //<gen>csharp_demo_send_smtp
        var smtpClient = new SmtpClient(imapSmtpAccess.SecureSmtpServerHost)
        {
            Port = imapSmtpAccess.SecureSmtpServerPort,
            Credentials = new NetworkCredential(userName: imapSmtpAccess.SecureSmtpUsername,
                password: imapSmtpAccess.SecureSmtpPassword),
            EnableSsl = true
        };
        // smtpClient.Send(...);
        //</gen>
        Assert.That(smtpClient, Is.Not.Null);
        //<gen>csharp_demo_list_inboxes
        var inboxes = inboxController.GetAllInboxes(page: 0, size: 10);
        Assert.Multiple(() =>
        {
            // pagination
            Assert.That(inboxes.Pageable.PageNumber, Is.EqualTo(0));
            Assert.That(inboxes.Pageable.PageSize, Is.EqualTo(10));
            // inboxes 
            var inboxItem = inboxes.Content.First();
            Assert.That(inboxItem.EmailAddress, Is.Not.Null);
        });
        //</gen>
        //<gen>csharp_demo_delete_inbox
        inboxController.DeleteInbox(inbox.Id);
        //</gen>
    }
}