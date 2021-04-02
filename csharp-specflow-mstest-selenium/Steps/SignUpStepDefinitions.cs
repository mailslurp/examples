using System;
using System.Net;
using System.Text.RegularExpressions;
using FluentAssertions;
using mailslurp.Api;
using mailslurp.Client;
using mailslurp.Model;
using OpenQA.Selenium;
using OpenQA.Selenium.Firefox;
using TechTalk.SpecFlow;

namespace SpecflowSeleniumExample.Steps
{
    [Binding]
    public sealed class SignUpStepDefinitions
    {
        
        private static IWebDriver _webdriver;
        private static Configuration _mailslurpConfig;
        
        // get a MailSlurp API Key free at https://app.mailslurp.com
        private static readonly string YourApiKey = Environment.GetEnvironmentVariable("API_KEY", EnvironmentVariableTarget.Process);
        private static readonly string DriverPath = Environment.GetEnvironmentVariable("DRIVER_PATH", EnvironmentVariableTarget.Process);
        private static readonly long TimeoutMillis = 30_000L;
        
        private readonly ScenarioContext _scenarioContext;
        private const string Password = "test-password";

        public SignUpStepDefinitions(ScenarioContext scenarioContext)
        {
            _scenarioContext = scenarioContext;
            
                // set up the webdriver for selenium
                var timespan = TimeSpan.FromMilliseconds(TimeoutMillis);
                var service = string.IsNullOrEmpty(DriverPath) 
                    ? FirefoxDriverService.CreateDefaultService()
                    : FirefoxDriverService.CreateDefaultService(DriverPath);
                _webdriver = new FirefoxDriver(service, new FirefoxOptions(), timespan);
                _webdriver.Manage().Timeouts().ImplicitWait = timespan;
                
                // configure mailslurp with API Key
                YourApiKey.Should().NotBeNull();
                _mailslurpConfig = new Configuration();
                _mailslurpConfig.ApiKey.Add("x-api-key", YourApiKey);
        }

        [After]
        public void After()
        {
            _webdriver.Quit();
            _webdriver.Dispose();
        }

        [Given("a user visits the demo app")]
        public void GivenAUserVisitsTheDemoApp()
        {
            _webdriver.Navigate().GoToUrl("https://playground.mailslurp.com");
            _webdriver.Title.Should().Contain("React App");
            
            // can click the signup button
            _webdriver.FindElement(By.CssSelector("[data-test=sign-in-create-account-link]")).Click();
        }

        [Given("has a test email address")]
        public void GivenHasATestEmailAddress()
        {
            
            // first create a test email account
            var inboxControllerApi = new InboxControllerApi(_mailslurpConfig);
            var response= inboxControllerApi.CreateInboxWithHttpInfo();
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var inbox = response.Data;
            
            // inbox has a real email address
            _scenarioContext.Add("emailAddress", inbox.EmailAddress);
            _scenarioContext.Add("inboxId", inbox.Id);
            
        }

        [When("the user signs up")]
        public void WhenTheUserSignsUp()
        {
            // next fill out the sign-up form with email address and a password
            _webdriver.FindElement(By.Name("email")).SendKeys(_scenarioContext.Get<string>("emailAddress"));
            _webdriver.FindElement(By.Name("password")).SendKeys(Password);
            
            // submit form
            _webdriver.FindElement(By.CssSelector("[data-test=sign-up-create-account-button]")).Click();
        }

        [Then("they receive a confirmation code by email and can verify their account")]
        public void ThenTheyReceiveAConfirmationCodeByEmailAndCanVerifyTheirAccount()
        {

            var inboxId = _scenarioContext.Get<Guid>("inboxId");
            var emailAddress = _scenarioContext.Get<string>("emailAddress");
            var waitForControllerApi = new WaitForControllerApi(_mailslurpConfig);
            var email = waitForControllerApi.WaitForLatestEmail(inboxId: inboxId, timeout: TimeoutMillis, unreadOnly: true);

            // verify the contents
            email.Subject.Should().Contain("Please confirm your email address");
            
            // we need to get the confirmation code from the email
            var rx = new Regex(@".*verification code is (\d{6}).*", RegexOptions.Compiled);
            var match = rx.Match(email.Body);
            var confirmationCode = match.Groups[1].Value;

            confirmationCode.Length.Should().Be(6);
            
            
            // fill the confirm user form with the confirmation code we got from the email
            _webdriver.FindElement(By.Name("code")).SendKeys(confirmationCode);
            _webdriver.FindElement(By.CssSelector("[data-test=confirm-sign-up-confirm-button]")).Click();
            
            // load the main page again
            _webdriver.Navigate().GoToUrl("https://playground.mailslurp.com");
            
            // login with email and password (we expect it to work now that we are confirmed)
            _webdriver.FindElement(By.Name("username")).SendKeys(emailAddress);
            _webdriver.FindElement(By.Name("password")).SendKeys(Password);
            _webdriver.FindElement(By.CssSelector("[data-test=sign-in-sign-in-button]")).Click();

            // verify that user can see authenticated content
            _webdriver.FindElement(By.TagName("h1")).Text.Contains("Welcome").Should().BeTrue();
        }
    }
}
