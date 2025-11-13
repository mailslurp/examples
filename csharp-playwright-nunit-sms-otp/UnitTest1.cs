namespace csharp_playwright_nunit_sms_otp;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;

[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class Tests : PageTest
{
    /**
     * Load the test application, then use a MailSlurp phone number to sign up via SMS OTP
     * Once submitted use the WaitFor controller to wait for the SMS
     * Then extract the verificaiton code and submit it and expect a logged in dashboard
     */
    [Test]
    public async Task HomepageHasPlaywrightInTitleAndGetStartedLinkLinkingtoTheIntroPage()
    {
        // --- MailSlurp setup ---
            var apiKey = Environment.GetEnvironmentVariable("API_KEY");
            Assert.That(apiKey, Is.Not.Null.And.Not.Empty, "API_KEY env var must be set");

            var config = new Configuration();
            // Note: the key name here is what the C# SDK expects for API key auth:
            config.ApiKey.Add("x-api-key", apiKey);

            var phoneController = new PhoneControllerApi(config);
            var waitForController = new WaitForControllerApi(config);

            // --- Load playground app and open sign up ---
            await Page.GotoAsync("https://playground-sms.mailslurp.com");
            await Page.ClickAsync("[data-test=\"sign-in-create-account-link\"]");

            // --- Fetch a US phone number from your MailSlurp account ---
            // Adjust parameter names if your SDK version differs slightly.
            var phonePage = await phoneController.GetPhoneNumbersAsync(
                phoneCountry: nameof(PhoneNumberProjection.PhoneCountryEnum.US)
            );

            // assert phone number exists
            Assert.That(phonePage.Content.Count, Is.GreaterThanOrEqualTo(1));
            var phone = phonePage.Content.First();
            Assert.That(phone.PhoneNumber, Does.StartWith("+1"));

            // --- Fill sign up form ---
            const string password = "test-password-123";

            // Strip +1 for the local number field, to match the UI input method
            var localNumber = phone.PhoneNumber.Replace("+1", string.Empty);

            await Page.FillAsync("input[name=phone_line_number]", localNumber);
            await Page.FillAsync("input[name=password]", password);

            // Submit sign-up
            await Page.ClickAsync("[data-test=\"sign-up-create-account-button\"]");

            // --- Wait for verification SMS with MailSlurp ---
            var waitOptions = new WaitForSingleSmsOptions(
                phoneNumberId: phone.Id,
                timeout: 30000L,
                unreadOnly: true
            );

            var sms = await waitForController.WaitForLatestSmsAsync(waitOptions);
            Assert.That(sms.Body, Is.Not.Null.And.Not.Empty, "Expected SMS body");

            // Extract 6-digit confirmation code from SMS body
            var match = Regex.Match(sms.Body, "([0-9]{6})$");
            Assert.That(match.Success, "Could not find 6-digit code in SMS body");
            var code = match.Groups[1].Value;

            // --- Enter confirmation code ---
            await Page.FillAsync("[data-test=\"confirm-sign-up-confirmation-code-input\"]", code);
            await Page.ClickAsync("[data-test=\"confirm-sign-up-confirm-button\"]");

            // --- Sign in with phone number + password ---
            await Page.FillAsync("[data-test=\"username-input\"]", phone.PhoneNumber);
            await Page.FillAsync("[data-test=\"sign-in-password-input\"]", password);

            await Page.ClickAsync("[data-test=\"sign-in-sign-in-button\"]");

            // Wait for greeting element to appear
            await Page.Locator("[data-test='greetings-nav']").WaitForAsync();
    }
}