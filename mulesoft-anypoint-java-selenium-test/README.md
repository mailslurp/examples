 # MuleSoft Anypoint Selenium OTP Email Test

This project demonstrates OTP email verification testing using Selenium WebDriver and MailSlurp API within a MuleSoft Anypoint project structure.

## Overview

The test performs a complete email verification flow on the MailSlurp playground site:

1. **Create Inbox** - Creates a real email inbox via MailSlurp API
2. **Sign Up** - Fills in the signup form with the generated email address
3. **Receive Email** - Waits for the verification email using `waitForLatestEmail`
4. **Extract OTP** - Extracts the 6-digit verification code using regex `([0-9]{6})$`
5. **Verify Account** - Submits the OTP code to confirm the account
6. **Login** - Logs in with the confirmed credentials
7. **Assert Welcome** - Verifies the "Welcome" text appears after login

## Prerequisites

- Java 8 or higher
- Maven 3.6+
- Google Chrome browser installed
- A MailSlurp API key (get one free at https://app.mailslurp.com)

## Configuration

The test uses the `MAILSLURP_API_KEY` environment variable for authentication with the MailSlurp API.

## Running the Test

Set your MailSlurp API key and run:

```bash
# Using the API_KEY or MAILSLURP_API_KEY environment variable
MAILSLURP_API_KEY=your_api_key_here mvn test

# Or export it first
export MAILSLURP_API_KEY=your_api_key_here
mvn test
```

## Project Structure

```
mulesoft-project/
├── pom.xml                              # Maven configuration with dependencies
├── README.md                            # This file
└── src/
    ├── main/
    │   └── java/
    │       └── com/smoketest/selenium/
    └── test/
        └── java/
            └── com/smoketest/selenium/
                └── OtpEmailVerificationTest.java  # Full OTP email test
```

## Dependencies

- **Selenium WebDriver** (4.18.1) - Browser automation
- **MailSlurp Java Client** (17.0.0) - Email inbox creation and retrieval
- **JUnit 4** (4.13.2) - Test framework
- **SLF4J** (2.0.5) - Logging

## Test Configuration

| Setting | Value |
|---------|-------|
| Browser | Chrome |
| Timeout | 60 seconds |
| Target URL | https://playground.mailslurp.com |
| Test Password | test-password |

## Headless Mode

To run in headless mode (no visible browser window), uncomment this line in `OtpEmailVerificationTest.java`:

```java
options.addArguments("--headless");
```

## Troubleshooting

- **ChromeDriver not found**: Selenium 4.6+ includes automatic driver management. Ensure Chrome is installed.
- **API key invalid**: Verify your MAILSLURP_API_KEY environment variable is set correctly.
- **Timeout errors**: Increase `TIMEOUT_MILLIS` if on a slow network connection.

## License

This project is for demonstration purposes as part of MuleSoft Anypoint testing examples.
