# Inbox documentation workflows

Reusable SDK examples for the [MailSlurp inbox documentation](https://www.mailslurp.com/docs/inboxes/).
Each file contains parameterized helpers. Importing or compiling a file does not create resources,
send email, delete inboxes, or open an IMAP connection. Call only the helpers needed for your workflow.

## Install and configure

Run the install command from the relevant language directory. Set `MAILSLURP_API_KEY` in your
server-side environment, then call the setup helper shown in that file. Keep API keys and returned
IMAP/SMTP credentials out of logs and browser code.

| Language | Source | Dependencies | Install or compile |
| --- | --- | --- | --- |
| JavaScript (Node.js 20+) | `javascript/workflows.js` | `mailslurp-client` 17.6.0; ImapFlow 1.0.195 | `npm ci` |
| Python (3.9+) | `python/workflows.py` | `mailslurp-client` 17.5.0; standard-library IMAP/TLS | `python -m pip install -r requirements.txt` |
| Go (1.21+) | `go/workflows.go` | pinned MailSlurp client commit; go-imap 1.2.1 | `go test ./...` (compile only; no live tests) |
| Java (11+) | `java/InboxWorkflows.java` | MailSlurp 17.5.0; Jakarta Mail 2.1.3; Angus Mail 2.0.3 | `mvn test-compile -DskipTests` |
| C# (.NET 8) | `csharp/InboxWorkflows.cs` | MailSlurp 17.5.0; MailKit 4.18.1 | `dotnet build` |
| PHP (8.2+, with IMAP extension) | `php/workflows.php` | MailSlurp 17.5.0 | `composer install` |
| Ruby | `ruby/workflows.rb` | MailSlurp 17.5.0; net-imap 0.6.x | `bundle install` |

Python's client can be closed with `with create_client() as api_client:`. Go's `NewClient` returns
both the SDK client and its authenticated context. The Java, C#, PHP and Ruby setup helpers use
the client/configuration forms required by their SDKs; pass those results to subsequent helpers.

## Run a create-and-wait example

These commands create one temporary inbox and wait for your application to send it a welcome
email. They do not send or delete mail. The inbox expires after five minutes. Run one command,
then trigger your application's email using the address it prints. The wait returns an email ID
when an unread message matches both that recipient and a subject containing `Welcome`.

From `javascript/`, after installing dependencies and setting `MAILSLURP_API_KEY`:

```sh
node --input-type=module <<'JS'
import { createClient, createExpiring, waitMatching } from './workflows.js';
const mailslurp = createClient();
const inbox = await createExpiring(mailslurp);
const since = new Date();
console.log('Trigger your application email to:', inbox.emailAddress);
const email = await waitMatching(mailslurp, inbox.id, 'Welcome', inbox.emailAddress, since);
console.log('Received email ID:', email.id);
JS
```

From `python/`, after installing dependencies and setting `MAILSLURP_API_KEY`:

```sh
python - <<'PYTHON'
from datetime import datetime, timezone
from workflows import create_client, create_expiring, wait_matching

with create_client() as client:
    inbox = create_expiring(client)
    since = datetime.now(timezone.utc)
    print('Trigger your application email to:', inbox.email_address, flush=True)
    email = wait_matching(client, inbox.id, 'Welcome', inbox.email_address, since)
    print('Received email ID:', email.id)
PYTHON
```

The other projects provide library helpers to call from your own application or test runner.
Java's Maven build compiles `InboxWorkflows.java`; call its static methods using the client from
`InboxSetup.createClient()`. C# builds a library; reference its project and use the configuration
from `InboxSetup.CreateConfiguration()`. Go exports its helpers from package `inboxdocs`;
import the module and call `NewClient()` before an operation. PHP loads the helpers with
`require 'workflows.php'`, then `inboxClients()`. Ruby loads them with
`require_relative 'workflows'`, then `create_client`; run your caller with `bundle exec ruby`.

### Call the Go, PHP and Ruby helpers

These examples read an existing inbox. Set `MAILSLURP_INBOX_ID` to an inbox you can access,
as well as `MAILSLURP_API_KEY`.

For Go, save this as `go/cmd/read-inbox/main.go`, then run `go run ./cmd/read-inbox` from `go/`:

```go
package main

import (
    "fmt"
    "log"
    "os"
    inboxdocs "github.com/mailslurp/examples/documentation-inboxes"
)

func main() {
    client, ctx, err := inboxdocs.NewClient()
    if err != nil { log.Fatal(err) }
    inbox, err := inboxdocs.GetInbox(client, ctx, os.Getenv("MAILSLURP_INBOX_ID"))
    if err != nil { log.Fatal(err) }
    fmt.Println(inbox.Id)
}
```

From `php/`:

```sh
php -r 'require "workflows.php"; $inbox = getSavedInbox(inboxClients(), getenv("MAILSLURP_INBOX_ID")); echo $inbox->getId(), PHP_EOL;'
```

From `ruby/`:

```sh
bundle exec ruby -r ./workflows -e 'inbox = get_inbox(create_client, ENV.fetch("MAILSLURP_INBOX_ID")); puts inbox.id'
```

### Call the Java and C# helpers

These examples create one inbox that expires after five minutes. They do not send or delete mail.
For Java, save `RunInbox.java` beside `InboxWorkflows.java`:

```java
public class RunInbox {
    public static void main(String[] args) throws Exception {
        var client = InboxSetup.createClient();
        var inbox = InboxWorkflows.createExpiring(client);
        System.out.println(inbox.getId() + " " + inbox.getEmailAddress());
    }
}
```

From `java/`, with `MAILSLURP_API_KEY` set, run:

```sh
mvn compile org.codehaus.mojo:exec-maven-plugin:3.5.0:java -Dexec.mainClass=RunInbox
```

For C#, create a caller project beside the library. From `csharp/`:

```sh
dotnet new console --framework net8.0 --output ../csharp-run
dotnet add ../csharp-run/csharp-run.csproj reference InboxWorkflows.csproj
```

Replace `csharp-run/Program.cs` with:

```csharp
var configuration = InboxSetup.CreateConfiguration();
var inbox = InboxWorkflows.CreateExpiring(configuration);
Console.WriteLine($"{inbox.Id} {inbox.EmailAddress}");
```

With `MAILSLURP_API_KEY` set, run `dotnet run --project ../csharp-run/csharp-run.csproj`
from `csharp/`.

## Choose a workflow

Each language exports the same documentation regions. The examples are independent recipes,
not a script that should run from top to bottom.

| Region suffix | Operation and required inputs |
| --- | --- |
| `setup` | Import dependencies and configure a client from the environment. |
| `create_random` | Create an inbox with a generated address, a name and tags. |
| `create_pool` | Create a generated address using the MailSlurp domain pool. |
| `create_custom` | Create the full `verifiedAddress` supplied by the caller on an available verified domain. |
| `create_virtual` | Create an inbox that captures outgoing mail without external delivery. |
| `create_expiring` | Create an inbox that expires after five minutes; `expiresIn` is milliseconds. |
| `catch_all` | Enable a custom domain's catch-all, then retrieve its inbox. Requires the domain ID. |
| `plus_address` | Create or retrieve a plus address, then list its first page of received emails. |
| `send` | Send HTML email and return the confirmed sent-email record. Supply an owned inbox and intended recipient. |
| `wait_latest` | Wait up to 60 seconds for an unread email received since the supplied test start time. |
| `wait_matching` | Apply the same wait with subject-fragment and full-recipient matching. |
| `list_inboxes` | List a page of inboxes with one tag filter. |
| `list_emails` | List a page of received-email previews for an inbox ID. |
| `get_inbox` | Retrieve the inbox by its ID. |
| `get_email` | Retrieve a complete email using an email ID from a preview or wait result. |
| `access` | Retrieve inbox-specific IMAP and SMTP server details and credentials. |
| `imap_tls` | Connect using the returned secure IMAP host/port, verify TLS certificates, and select the returned mailbox read-only. |
| `webhook` | Register an `EMAIL_RECEIVED` webhook for a supplied public HTTPS receiver URL. |
| `delete_inbox` | Delete a disposable inbox when its address and messages are no longer needed. |

Capture `since` before triggering the application that sends the email. Match waits use both
`SUBJECT CONTAIN` and `TO CONTAIN`; pass the full expected recipient address and a subject
fragment specific to the test. An email that already meets those filters can be returned immediately.
Transport timeouts allow more than the 60-second server wait. Errors and timeouts propagate to the
caller so the test or application can handle them explicitly.

List helpers return one page. Increment the page number to continue until the response's `last`
flag is true or its `content` is empty; do not assume totals are always available. Plus-address
local parts do not create separate inboxes. Catch-all delivery applies to otherwise unmatched
addresses on the configured domain. Account permissions and limits still apply to these features.

## Documentation regions

Regions use `inbox_docs_<suffix>` identifiers. The examples shortcode generator prefixes the
language, producing `gen_javascript_inbox_docs_send`, `gen_python_inbox_docs_send`,
`gen_go_inbox_docs_send`, `gen_java_inbox_docs_send`, `gen_csharp_inbox_docs_send`,
`gen_php_inbox_docs_send`, and `gen_ruby_inbox_docs_send`.

JavaScript, Go, Java, C# and PHP use `//<gen>inbox_docs_<suffix>` and `//</gen>`.
Python and Ruby use `# <gen>inbox_docs_<suffix>` and `# </gen>`. Keep markers paired and avoid
nesting regions. If `gofmt` inserts a space in a Go marker, restore the `//<gen>` spelling expected
by the generator after formatting.
