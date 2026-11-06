# Webhook documentation workflows

Reusable SDK examples for the [MailSlurp documentation](https://www.mailslurp.com/docs/webhooks/): create an inbox webhook, list webhooks, send test data, verify a payload signature and delete a webhook.
Each file contains parameterized helpers. Importing or compiling a file makes no requests;
call only the helpers you need. Your endpoint must accept HTTPS POST requests. Verify each payload with the x-message-id and x-signature headers.

## Install and configure

Set `MAILSLURP_API_KEY` in your server-side environment and keep it out of browser code and logs.

| Language | Source | Dependencies | Install or compile |
| --- | --- | --- | --- |
| JavaScript (Node.js 20+) | `javascript/workflows.js` | `mailslurp-client` 17.6.0 | `npm install` |
| Python (3.9+) | `python/workflows.py` | `mailslurp-client` 17.6.0 | `python -m pip install -r requirements.txt` |
| Java (11+) | `java/WebhookWorkflows.java` | `mailslurp-client-java` 17.6.0 | `mvn test-compile -DskipTests` |
| C# (.NET 8) | `csharp/WebhookWorkflows.cs` | `mailslurp` 17.5.0 | `dotnet build` |

Each `<gen>` region is published as a documentation snippet named `gen_<language>_<region>`.
