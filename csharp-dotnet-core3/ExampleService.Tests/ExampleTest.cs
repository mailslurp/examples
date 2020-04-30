using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;
using Xunit;

// Example usage for MailSlurp email API plugin
namespace ExampleService.Tests
{
    public class ExampleTest
    {
        // get an api key free at https://app.mailslurp.com
        private static readonly string YourApiKey = Environment.GetEnvironmentVariable("API_KEY", EnvironmentVariableTarget.Process);

        [Fact]
        public void CanSetupMailSlurp_AndCreateInbox()
        {
            Assert.NotNull(YourApiKey);

            // first configure your api key
            var config = new Configuration();
            config.ApiKey.Add("x-api-key", YourApiKey);

            // create an inbox controller
            var apiInstance = new InboxControllerApi(config);
            
            // then create an inbox
            var inbox = apiInstance.CreateInbox();
            Assert.NotNull(inbox);
            Assert.Contains("@mailslurp.com", inbox.EmailAddress);
        }
        
        private static readonly long Timeout = 30000L;
        private static readonly bool UnreadOnly = true;

        [Fact]
        public void CanSendEmail_ThenReceiveIt()
        {

            // first configure your api key
            var config = new Configuration();
            config.ApiKey.Add("x-api-key", YourApiKey);

            // create two inboxes
            var apiInstance = new InboxControllerApi(config);
            var inbox1 = apiInstance.CreateInbox();
            var inbox2 = apiInstance.CreateInbox();
            
            Assert.NotEqual(inbox1.EmailAddress, inbox2.EmailAddress);

            // send email from inbox1 to inbox2
            var sendEmailOptions = new SendEmailOptions()
            {
                To = new List<string>() {inbox2.EmailAddress},
                Subject = "Hello inbox2",
                Body = "Your code is: 123"
            };
            apiInstance.SendEmail(inbox1.Id, sendEmailOptions);
            
            // wait for email in inbox2 and read it
            var waitForInstance = new WaitForControllerApi(config);
            var email = waitForInstance.WaitForLatestEmail(inbox2.Id, Timeout, UnreadOnly);
            
            Assert.NotNull(email);
            Assert.Equal( inbox1.EmailAddress, email.From);
            Assert.Equal("Hello inbox2", email.Subject);
            Assert.Contains("Your code is: ", email.Body);
            
            // extract a code from email body
            var rx = new Regex(@"Your code is: ([0-9]{3})", RegexOptions.Compiled);
            var match = rx.Match(email.Body);
            var code = match.Groups[1].Value;
            Assert.Equal("123", code);
        }
    }
}