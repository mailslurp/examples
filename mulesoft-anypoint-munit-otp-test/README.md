# MuleSoft MUnit OTP Email Test

This project demonstrates **idiomatic MuleSoft development** for OTP email verification testing using:

- **Mule Flows** - Visual, declarative flow design
- **HTTP Connectors** - Native Mule HTTP requests to MailSlurp API
- **DataWeave** - Mule's transformation language for data extraction
- **MUnit** - MuleSoft's native testing framework
- **Java Module** - Selenium browser automation via Java invoke

## Flow-Based Approach vs Plain Java

| Aspect | This Project (Flow-Based) | Java-Only Approach |
|--------|---------------------------|-------------------|
| **Structure** | Visual Mule flows with connectors | Pure Java test classes |
| **API Calls** | Native HTTP Connector | MailSlurp Java SDK |
| **Data Transform** | DataWeave expressions | Java regex/parsing |
| **Testing** | MUnit test suites | JUnit tests |
| **Visibility** | Visual in Anypoint Studio | Code-only |
| **Reusability** | Flows can be reused/composed | Method calls |

### Benefits of Flow-Based Approach

1. **Visual Design** - See the flow in Anypoint Studio's graphical editor
2. **Native Connectors** - Use Mule's optimized HTTP connector
3. **DataWeave Power** - Elegant data transformation with less code
4. **MUnit Testing** - Test flows with mocking, assertions, coverage
5. **Enterprise Ready** - Easily add error handling, transactions, etc.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  otp-email-verification-flow                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │ HTTP POST   │───▶│ DataWeave        │───▶│ Java Invoke  │   │
│  │ /inboxes    │    │ Extract inbox ID │    │ Browser      │   │
│  └─────────────┘    │ & email address  │    │ Signup       │   │
│                     └──────────────────┘    └──────────────┘   │
│                                                     │          │
│                                                     ▼          │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │ HTTP GET    │◀───│ Wait for email   │◀───│              │   │
│  │ /waitFor... │    │                  │    │              │   │
│  └─────────────┘    └──────────────────┘    └──────────────┘   │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────────┐    ┌──────────────┐    ┌─────────────┐   │
│  │ DataWeave        │───▶│ Java Invoke  │───▶│ Success     │   │
│  │ Extract OTP      │    │ Enter Code   │    │ Response    │   │
│  │ using regex      │    │ & Login      │    │             │   │
│  └──────────────────┘    └──────────────┘    └─────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Java 8 or higher
- Maven 3.6+
- Google Chrome browser installed
- MailSlurp API key (free at https://app.mailslurp.com)

## Project Structure

```
mulesoft-anypoint-munit-otp-test/
├── pom.xml                                    # Maven config with MUnit
├── Makefile                                   # Build automation
├── README.md                                  # This file
├── mule-artifact.json                         # Mule app descriptor
├── src/
│   ├── main/
│   │   ├── mule/
│   │   │   └── otp-email-test-flow.xml       # Main Mule flow
│   │   ├── resources/
│   │   │   ├── config.yaml                   # Configuration properties
│   │   │   └── log4j2.xml                    # Logging config
│   │   └── java/
│   │       └── com/smoketest/selenium/
│   │           └── BrowserHelper.java        # Selenium helper class
│   └── test/
│       ├── munit/
│       │   └── otp-email-test-suite.xml      # MUnit test suite
│       └── resources/
│           └── log4j2-test.xml               # Test logging config
```

## Configuration

### Environment Variable (Recommended)

```bash
export MAILSLURP_API_KEY=your_api_key_here
```

### Using .env File

Create `../.env` (parent directory) with:
```
MAILSLURP_API_KEY=your_api_key_here
```

The Makefile will automatically load this.

### Direct Configuration (Not Recommended)

Edit `src/main/resources/config.yaml`:
```yaml
mailslurp:
  apiKey: "your_api_key_here"
```

## Running Tests

### Using Make (Recommended)

```bash
# Show available commands
make help

# Run all tests
make test

# Run MUnit tests specifically
make test_munit

# Run with verbose output
make test_verbose

# Clean build
make clean
```

### Using Maven Directly

```bash
# Run all tests
MAILSLURP_API_KEY=your_key mvn test

# Run MUnit tests
mvn test -Dmunit.test=otp-email-test-suite

# Run with specific test
mvn test -Dmunit.test=otp-email-test-suite#otp-email-verification-flow-test
```

## Opening in Anypoint Studio

1. **File** → **Import**
2. Select **Anypoint Studio** → **Anypoint Studio project from File System**
3. Browse to this directory
4. Click **Finish**

The flow will appear in the visual designer where you can:
- See the flow structure graphically
- Click on any component to view/edit its configuration
- Run/debug flows directly
- Execute MUnit tests with coverage

## Test Flow Description

The `otp-email-verification-flow` performs:

1. **Create Inbox** - HTTP POST to MailSlurp API creates a real email inbox
2. **Extract Details** - DataWeave extracts `inboxId` and `emailAddress`
3. **Browser Signup** - Java invoke opens Chrome, fills signup form
4. **Wait for Email** - HTTP GET to MailSlurp waits for verification email
5. **Extract OTP** - DataWeave regex extracts 6-digit code from email body
6. **Verify & Login** - Java invoke enters code, logs in, asserts "Welcome"
7. **Return Success** - JSON response with test results

## DataWeave OTP Extraction

The OTP code is extracted using DataWeave's regex capabilities:

```dataweave
%dw 2.0
import * from dw::core::Strings
var emailBody = payload.body
var codeMatch = emailBody scan /([0-9]{6})$/
---
if (sizeOf(codeMatch) > 0) codeMatch[0][1] else null
```

## MUnit Test Assertions

The MUnit test validates:
- `success` is `true`
- `otpCodeVerified` is `true`
- `emailAddress` is present
- `inboxId` is present

## Error Handling

The flow includes comprehensive error handling:
- Browser is closed on any error
- Error response includes type, description, and details
- All errors are logged

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Mule HTTP Connector | 1.10.3 | API requests |
| Mule Java Module | 1.2.13 | Java invoke |
| MUnit Runner | 3.3.1 | Test execution |
| MUnit Tools | 3.3.1 | Assertions |
| Selenium | 4.18.1 | Browser automation |

## Troubleshooting

### API Key Not Set
```
ERROR: MAILSLURP_API_KEY environment variable is not set
```
→ Set the environment variable or create `.env` file

### Chrome Not Found
```
Cannot find Chrome binary
```
→ Install Google Chrome browser

### MUnit Tests Timeout
→ Increase timeout in config.yaml or MUnit test configuration

### Flow Not Found in Studio
→ Ensure you imported as "Anypoint Studio project from File System"

## Related Projects

- [mulesoft-anypoint-java-selenium-test](../mulesoft-anypoint-java-selenium-test) - Plain Java/JUnit approach

## License

This project is for demonstration purposes as part of MuleSoft Anypoint testing examples.
