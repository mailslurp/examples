using System;
using System.Net;
using System.Net.Mail;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;
using Xunit;

namespace SmtpService.Tests
{
    public class UnitTest1
    {
        [Fact]
        public void CanSendEmailWithMailSlurpSmtp()
        {
            var apiKey = Environment.GetEnvironmentVariable("API_KEY")
                         ?? throw new ArgumentNullException("Missing API_KEY environment variable containing MailSlurp key");

            // configure client
            var config = new Configuration();
            config.ApiKey.Add("x-api-key", apiKey);
            var inboxController = new InboxControllerApi(config);

            // create an smtp inbox
            var inbox = inboxController.CreateInboxWithOptions(new CreateInboxDto(
                inboxType: CreateInboxDto.InboxTypeEnum.SMTPINBOX
            ));
            Assert.Contains("@mailslurp.mx", inbox.EmailAddress);

            // get smtp host, port, password, username etc
            var imapSmtpAccessDetails = inboxController.GetImapSmtpAccess();
            var smtpClient = new SmtpClient(imapSmtpAccessDetails.SmtpServerHost)
            {
                Port = imapSmtpAccessDetails.SmtpServerPort,
                Credentials = new NetworkCredential(userName: imapSmtpAccessDetails.SmtpUsername, password: imapSmtpAccessDetails.SmtpPassword),
                // disable ssl recommended
                EnableSsl = false
            };
            
            // send email to inbox
            smtpClient.Send(from: "test@external.com", recipients: inbox.EmailAddress, subject: "This inbound", body: "Hello");
            
            // wait for email to arrive
            var waitController = new WaitForControllerApi(config);
            waitController.WaitForLatestEmail(inboxId: inbox.Id, timeout: 30_000);
        }
    }
}