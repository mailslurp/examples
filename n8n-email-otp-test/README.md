# n8n Email OTP Verification Test

This project demonstrates OTP email verification testing using **n8n** workflow automation and the **MailSlurp API**. The workflow creates a real email inbox, signs up on a test site, waits for a verification email, extracts the OTP code, and completes the verification process.

## Overview

n8n is a free, open-source workflow automation tool that can self-host or run locally. This example shows how to test email-based OTP verification flows using n8n's visual workflow editor and MailSlurp's disposable email addresses.

### Workflow Steps

1. **Create Inbox** - HTTP Request to MailSlurp API creates a real email address
2. **Browser Signup** - Execute Command node runs Puppeteer script to fill signup form
3. **Wait for Email** - HTTP Request polls MailSlurp API for verification email
4. **Extract OTP** - Code node uses regex to extract 6-digit verification code
5. **Submit OTP** - Execute Command node runs Puppeteer to enter code
6. **Verify Login** - Check for "Welcome" message confirming successful verification
7. **Return Result** - Output success status with email address and verification confirmation

## Prerequisites

- **Node.js** 18+ and npm
- **Google Chrome** browser (for Puppeteer)
- **MailSlurp API Key** (free at https://app.mailslurp.com)

## Installation

### Using Make (Recommended)

```bash
# Install dependencies
make install

# Start n8n
make start

# Run test (in separate terminal)
make test

# Clean up
make clean
```

### Manual Setup

```bash
# Install dependencies
npm install

# Start n8n
npm start
# or
npx n8n start

# Access UI
open http://localhost:5678
```

## Configuration

### Set API Key

**Option 1: Environment Variable**
```bash
export MAILSLURP_API_KEY=your_api_key_here
make start
```

**Option 2: n8n Credentials**
1. Open n8n UI at http://localhost:5678
2. Click "Credentials" in the left sidebar
3. Add "HTTP Header Auth" credential:
   - Name: `MailSlurp API Key`
   - Header Name: `x-api-key`
   - Header Value: `your_api_key_here`

### Import Workflow

**Option 1: Auto-import (via Makefile)**
```bash
make import-workflow
```

**Option 2: Manual Import**
1. Start n8n: `npm start`
2. Open http://localhost:5678
3. Click "Import from File"
4. Select `workflows/otp-verification-workflow.json`

## Running the Workflow

### Via n8n UI

1. Open the imported workflow
2. Click "Execute Workflow" button
3. Watch nodes execute in sequence
4. Check execution log for results

### Via Test Script

```bash
# Run standalone test
make test

# Or directly
node test/otp-verification-test.js
```

### Via API

```bash
# Trigger workflow via webhook
curl -X POST http://localhost:5678/webhook/otp-test
```

## Project Structure

```
n8n-email-otp-test/
├── README.md                          # This file
├── package.json                       # Dependencies
├── Makefile                           # Build automation
├── .env.example                       # Environment variable template
├── workflows/
│   └── otp-verification-workflow.json # n8n workflow definition
├── scripts/
│   ├── browser-signup.js              # Puppeteer signup script
│   ├── browser-verify.js              # Puppeteer OTP submission script
│   └── extract-otp.js                 # OTP extraction logic
└── test/
    └── otp-verification-test.js       # Standalone test runner
```

## Workflow Nodes

### 1. Start Node
Triggers the workflow manually or via webhook.

### 2. Create Inbox (HTTP Request)
```http
POST https://api.mailslurp.com/inboxes
x-api-key: {{ $credentials.mailslurpApiKey }}
Content-Type: application/json
```

Outputs:
- `inboxId`: UUID of created inbox
- `emailAddress`: Generated email address (e.g., `test-abc123@mailslurp.net`)

### 3. Browser Signup (Execute Command)
```javascript
node scripts/browser-signup.js {{ $node["Create Inbox"].json["emailAddress"] }}
```

Opens Chrome via Puppeteer, navigates to https://playground.mailslurp.com, fills signup form.

### 4. Wait for Email (HTTP Request)
```http
GET https://api.mailslurp.com/waitForLatestEmail
  ?inboxId={{ $node["Create Inbox"].json["inboxId"] }}
  &timeout=60000
  &unreadOnly=true
x-api-key: {{ $credentials.mailslurpApiKey }}
```

Polls with 60-second timeout until email arrives.

### 5. Extract OTP (Code Node)
```javascript
const emailBody = $input.item.json.body;
const match = emailBody.match(/([0-9]{6})$/m);
return [{
  json: {
    otpCode: match ? match[1] : null,
    emailSubject: $input.item.json.subject,
    emailBody: emailBody
  }
}];
```

Uses regex to extract 6-digit code from email body.

### 6. Submit OTP (Execute Command)
```javascript
node scripts/browser-verify.js \\
  {{ $node["Extract OTP"].json["otpCode"] }} \\
  {{ $node["Create Inbox"].json["emailAddress"] }}
```

Enters OTP code, logs in, verifies "Welcome" message.

### 7. Return Result (Set Node)
```json
{
  "success": true,
  "message": "OTP Email Verification Completed",
  "details": {
    "emailAddress": "{{ $node["Create Inbox"].json["emailAddress"] }}",
    "inboxId": "{{ $node["Create Inbox"].json["inboxId"] }}",
    "otpCode": "{{ $node["Extract OTP"].json["otpCode"] }}",
    "verified": true
  }
}
```

## Troubleshooting

### n8n Won't Start

**Error:** Port 5678 already in use

**Solution:**
```bash
# Kill existing n8n process
pkill -f n8n

# Or use different port
n8n start --port 5679
```

### API Key Not Working

**Error:** 401 Unauthorized

**Solution:**
1. Check API key is correct: https://app.mailslurp.com/settings
2. Verify key is set in environment or n8n credentials
3. Check key has no extra spaces/quotes

### Chrome Not Found

**Error:** Puppeteer can't find Chrome executable

**Solution:**
```bash
# macOS
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Linux
export PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome"

# Or install Chromium via Puppeteer
npx puppeteer browsers install chrome
```

### Email Not Received

**Error:** Timeout waiting for email

**Solutions:**
1. Increase timeout in "Wait for Email" node (default 60000ms)
2. Check inbox ID is correct
3. Verify email was actually sent (check playground site)
4. Try manual API call:
   ```bash
   curl "https://api.mailslurp.com/waitForLatestEmail?inboxId=YOUR_INBOX_ID&timeout=60000" \\
     -H "x-api-key: YOUR_API_KEY"
   ```

### OTP Not Extracted

**Error:** OTP code is null

**Solutions:**
1. Print email body in Code node to inspect format
2. Adjust regex pattern for your email format:
   - End of line: `/([0-9]{6})$/m`
   - After "code:": `/code:\s*([0-9]{6})/`
   - Any 6 digits: `/([0-9]{6})/`
3. Check email `body` field (not `htmlBody`)

## Advanced Usage

### Custom Webhook Trigger

Modify Start node to use Webhook trigger:
1. Replace Start node with Webhook node
2. Set path: `/webhook/otp-test`
3. Set method: `POST`
4. Trigger via HTTP:
   ```bash
   curl -X POST http://localhost:5678/webhook/otp-test
   ```

### Scheduled Execution

Add Schedule Trigger node:
1. Click "+" to add node
2. Select "Schedule Trigger"
3. Set interval (e.g., every 1 hour)
4. Connect to workflow

### Email Notifications

Add Email Send node at end:
1. Click "+" after Return Result
2. Select "Email Send (SMTP)" or "Gmail" node
3. Configure SMTP settings
4. Send summary email on completion

## Comparison with Other Tools

| Feature | n8n | Power Automate | Zapier |
|---------|-----|----------------|--------|
| **Cost** | Free (self-hosted) | Requires Microsoft 365 | Free tier limited |
| **Self-Hosted** | ✅ Yes | ❌ No | ❌ No |
| **Visual Editor** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Code Nodes** | ✅ JavaScript | ⚠️ Limited | ⚠️ Limited |
| **HTTP Requests** | ✅ Full control | ✅ Yes | ✅ Yes |
| **Browser Automation** | ✅ Via exec | ⚠️ Premium | ❌ No |
| **Open Source** | ✅ Yes | ❌ No | ❌ No |

## Related Examples

- **MuleSoft Anypoint (MUnit + DataWeave):** [mulesoft-anypoint-munit-otp-test](../mulesoft-anypoint-munit-otp-test)
- **Java (JUnit + MailSlurp SDK):** [mulesoft-anypoint-java-selenium-test](../mulesoft-anypoint-java-selenium-test)
- **JavaScript (Puppeteer):** [javascript-jest-puppeteer](../javascript-jest-puppeteer)
- **Playwright:** [playwright-email-testing](../playwright-email-testing)

## Documentation

- **n8n Docs:** https://docs.n8n.io
- **MailSlurp API:** https://docs.mailslurp.com/api
- **Puppeteer:** https://pptr.dev

## Support

**Issues:** https://github.com/mailslurp/examples/issues  
**Email:** support@mailslurp.com  
**Discord:** https://discord.gg/mailslurp

## License

MIT - See [LICENSE](../../LICENSE) for details.
