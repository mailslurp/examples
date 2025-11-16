# MailSlurp ReadyAPI demonstration

This project shows you how to use the [MailSlurp REST API](https://swagger.mailslurp.com/) to create email accounts and receive OTP codes within ReadyAPI test cases.

## Setup
- Download project XML file
- Get a free [API Key](https://app.mailslurp.com)
- Edit XML, replace YOUR_API_KEY with your Api Key
- Open in ReadyAPI and inspect test cases

### From scratch
To start your own project
- Create an Authorization JWT Bearer token using your MailSlurp API Key
- Import the MailSlurp API from our [definitions endpoint](https://api.mailslurp.com/v2/api-docs/).
- Create tests using the MailSlurp API

## How it works
This demo runs a test against a demo app with a sign-up and confirmation user flow. We can sign up with an email address and the app sends us a confirmation code that we must submit to confirm the user account. The steps are as follows:

- Call MailSlurp createInbox endpoint
- Store the emailAddress and id as variables/properties
- Submit emailAddress to the test app signUp endpoint
- Call MailSlurps waitForLatestEmail endpoint with the id
- Receive email and store emailId 
- Use MailSlurp contentMatch feature to extract the OTP code
- Store OTP code as variable and submit it to test application confirm endpoint
- Assert 200,201 status code for user confirmation

## Links
- [API documentation](https://docs.mailslurp.com)
