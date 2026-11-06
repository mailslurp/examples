# Inbox placement documentation workflows

Reusable SDK examples for the [MailSlurp documentation](https://www.mailslurp.com/docs/inbox-placement/): create a placement test, send to its seed addresses, wait for results and count placement by provider.
Each file contains parameterized helpers. Importing or compiling a file makes no requests;
call only the helpers you need. Each placement test is billed. Send to the seeds from the domain and ESP you want to measure.

## Install and configure

Set `MAILSLURP_API_KEY` in your server-side environment and keep it out of browser code and logs.

| Language | Source | Dependencies | Install or compile |
| --- | --- | --- | --- |
| JavaScript (Node.js 20+) | `javascript/workflows.js` | `mailslurp-client` 17.6.0 | `npm install` |
| Python (3.9+) | `python/workflows.py` | `mailslurp-client` 17.6.0 | `python -m pip install -r requirements.txt` |
| Java (11+) | `java/InboxPlacementWorkflows.java` | `mailslurp-client-java` 17.6.0 | `mvn test-compile -DskipTests` |
| C# (.NET 8) | `csharp/InboxPlacementWorkflows.cs` | `mailslurp` 17.5.0 | `dotnet build` |

The C# helpers call the REST API with `HttpClient` because these endpoints are newer than the current `mailslurp` NuGet package (17.5.0).

Each `<gen>` region is published as a documentation snippet named `gen_<language>_<region>`.
