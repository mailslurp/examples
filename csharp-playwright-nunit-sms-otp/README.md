# SMS OTP testing with NUnit, C# and Playwright

This examples demonstrates how to use the [MailSlurp C# library](https://www.nuget.org/packages/mailslurp/) and phone numbers to test user sign-up and OTP SMS code verification. 

It contains an NUnit Playwright test that loads a [demo application](https://playground-sms.mailslurp.com) and uses a MailSlurp phone number to sign up, receive an SMS verification code, extract the code, fill out the verification form, and complete user sign-up.

## Run

```
dotnet restore
dotnet tool install Microsoft.Playwright.CLI
dotnet playwright install
```

## Test

> Set API_KEY environment variable or override the test with your [MailSlurp API key](https://app.mailslurp.com/)

### Windows
```
$env:API_KEY="your-api-key"; dotnet test
``` 

### Mac, Linux
```
API_KEY="your-api-key" dotnet test
``` 


