using System.Text.Json;
using mailslurp;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

namespace csharp_dotnet_8;

public class ExampleTest
{
    [Fact]
    public void TestCanSendAndReceiveEmail()
    {
        var apiKey = Environment.GetEnvironmentVariable("API_KEY");
        // create client
        var config = new Configuration();
        config.ApiKey.Add("x-api-key", apiKey);
        
        // create inboxes
        var inboxControllerApi = new InboxControllerApi(config);
        var inbox1 = inboxControllerApi.CreateInbox();
        var inbox2 = inboxControllerApi.CreateInbox();

        // send email
        inboxControllerApi.SendEmail(inbox1.Id, new SendEmailOptions(
            to: [inbox2.EmailAddress],
            subject: "Test CSharp",
            body: "<span>Hello</span>",
            isHTML: true
        ));

        // receive email with wait controller
        var email = new WaitForControllerApi(config).WaitForLatestEmail(inbox2.Id, 60000, true);
        Assert.Contains("Hello", email.Body);

        // list emails in inbox
        var emails = inboxControllerApi.GetInboxEmailsPaginated(inbox2.Id);
        Assert.Equal(1, emails.NumberOfElements);
        Assert.Equal("Test CSharp", emails.Content[0].Subject);
    }
}