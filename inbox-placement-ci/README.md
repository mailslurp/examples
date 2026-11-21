# Fail a build when Gmail or Outlook put your email in spam

A Node.js script and GitHub Actions workflow that run one [MailSlurp inbox placement test](https://www.mailslurp.com/docs/inbox-placement/) and fail the job when a Gmail or Outlook seed mailbox puts your email in spam or junk.

Each run:

1. creates a placement test with `POST /inbox-placement-tests`, which returns seed addresses at providers such as Gmail, Outlook and Microsoft 365, plus a tracking token;
2. sends your email to every seed through your own SMTP server or your ESP's SMTP relay, with the token in the subject;
3. waits, up to a time limit, for each seed to report the folder it found the email in;
4. prints a table per provider and exits with code 1 if any Gmail or Outlook seed reported spam or junk.

## What a seed test tells you

A seed test sends to a few mailboxes per provider. It shows how those providers filtered this email, from this sender and sending setup, at the time of the test. It is a sample, not your list-wide inbox rate: your subscribers' mailboxes have their own history, engagement and filter settings, and their results can differ.

That makes it a good regression check for changes you control: new DNS records or DKIM keys, a new ESP, IP pool or sending domain, or a template change. When one of those moves Gmail or Outlook seeds to spam, the build fails before the change reaches your list.

A seed that never reported is counted as missing, not as inbox. A missing seed means the test has no evidence for that mailbox; it doesn't mean the email arrived.

## Run it locally

You need Node.js 22.18 or later, a MailSlurp API key for an account with inbox placement tests, and SMTP credentials for the sender you want to measure. Most ESPs offer SMTP, including SendGrid, Postmark, Amazon SES, Mailgun, Resend and SMTP2GO. Use the From address and domain your real emails use, since placement depends on that sender's authentication and reputation.

```sh
npm ci
cp .env.example .env   # then fill it in
set -a; . ./.env; set +a
npm run placement
```

The script checks every setting and logs in to your SMTP server before it creates the test, so a typo doesn't use up a test. Each run that gets past that check uses one placement test and sends one email per seed.

| Setting | Required | Meaning |
| --- | --- | --- |
| `MAILSLURP_API_KEY` | yes | Your MailSlurp API key. |
| `SMTP_HOST`, `SMTP_PORT` | yes, port defaults to 587 | Your SMTP server or ESP relay. |
| `SMTP_USER`, `SMTP_PASS` | usually | SMTP login. Leave empty for an unauthenticated relay. |
| `SMTP_SECURE` | no | `true` for implicit TLS. Defaults to `true` on port 465 and STARTTLS otherwise. |
| `FROM_EMAIL` | yes | The From address. Its domain is recorded as the sender domain. |
| `FROM_NAME` | no | Display name for the From header. |
| `EMAIL_SUBJECT` | no | Subject line. The tracking token is added to the end. |
| `EMAIL_HTML_FILE` | no | Path to your HTML email. Defaults to [templates/sample-email.html](templates/sample-email.html). |
| `PLACEMENT_GATE_PROVIDERS` | no | Provider families that fail the build: `gmail`, `outlook`, `yahoo`, `apple`, `other`. Defaults to `gmail,outlook`. |
| `PLACEMENT_FAIL_ON_MISSING` | no | `true` also fails the build when a gated seed has no result. Defaults to `false`. |
| `PLACEMENT_TIMEOUT_SECONDS` | no | How long to wait for seed results. Defaults to 600. |
| `PLACEMENT_SEGMENT` | no | `ALL_INBOXES`, `PERSONAL_INBOXES` or `PROFESSIONAL_INBOXES`. Defaults to `ALL_INBOXES`. |
| `PLACEMENT_REPORT_FILE` | no | Writes the results as JSON, with seed addresses masked. |

Test the email you actually send. Point `EMAIL_HTML_FILE` at the rendered output of your template, and keep the subject close to the real one.

## How the script works

Create the test and keep its seed addresses and tracking token ([src/run.ts](src/run.ts)):

```ts
const run = await placement.createInboxPlacementTest({
  createInboxPlacementTestOptions: {
    requestedSegment: segment,
    senderDomain: fromEmail.split('@')[1],
    fromEmail,
    publicShareRequested: false,
    addressFormat: CreateInboxPlacementTestOptionsAddressFormatEnum.COMMA,
  },
});
const { trackingToken, seedAddresses } = run;
```

Send one message per seed through your SMTP server, with the token in the subject so MailSlurp can match it ([src/send.ts](src/send.ts)):

```ts
const subject = `${email.subject} ${trackingToken}`;
for (const to of seedAddresses) {
  await smtp.sendMail({ from: email.from, to, subject, html: email.html });
}
```

Poll the run with `getInboxPlacementTest` every 15 seconds until it finishes or the timeout passes, then read the per-seed results with `getInboxPlacementTestResults`. Each target has a `provider`, a `placementVerdict` and a `placementFolder`. [src/placement.ts](src/placement.ts) turns those into the table and the exit code.

## Reading the results

Here is the output of a real run of this example. The script masks seed addresses; the sender's domain is masked here as well.

```text
Created inbox placement test 973e719b-efaf-4a2f-b64a-2d5cb1636bb4 with 13 seeds and token mip-81aad7cb2581
Sent "Your weekly product update mip-81aad7cb2581" from ***@postmark.[test domain] to 13 seeds
  PARTIAL_COMPLETE: 12/13 seeds reported
  ... (the same line every 15 seconds, 38 times in all)
Stopped waiting after 602s; seeds without a result count as missing

Provider          Seeds  Inbox  Tab  Spam  Missing  Other  Gated
----------------  -----  -----  ---  ----  -------  -----  -----
Gmail Consumer    2      0      0    2     0        0      yes
Gmail Workspace   5      0      3    2     0        0      yes
Microsoft 365     5      4      0    0     1        0      yes
Outlook Personal  1      0      0    1     0        0      yes

  Gmail Consumer     da***@gm***.com        spam (SPAM), 6.2s
  Gmail Consumer     ja***@gm***.com        spam (SPAM), 13.2s
  Gmail Workspace    ol***@se***.com        spam (SPAM), 2.2s
  Gmail Workspace    ay***@pi***.com        spam (SPAM), 10.2s
  Gmail Workspace    de***@pi***.com        tab (UPDATES, INBOX), 15.2s
  Gmail Workspace    et***@se***.com        tab (UPDATES, INBOX), 19.2s
  Gmail Workspace    lu***@se***.com        tab (UPDATES, INBOX), 23.2s
  Microsoft 365      ta***@ma***.click      inbox (FOCUSED, inbox), 13.2s
  Microsoft 365      cl***@te***.io         inbox (FOCUSED, inbox), 21.2s
  Microsoft 365      el***@ma***.click      missing (no result yet)
  Microsoft 365      ni***@ma***.click      inbox (FOCUSED, inbox), 30.2s
  Microsoft 365      ow***@te***.io         inbox (FOCUSED, inbox), 35.2s
  Outlook Personal   de***@ou***.com        spam (SPAM, junkemail), 15.2s

FAIL: 5 of 13 Gmail or Outlook seeds put the email in spam or junk.
Full report (MailSlurp login): https://app.mailslurp.com/inbox-placement/973e719b-efaf-4a2f-b64a-2d5cb1636bb4
```

That run sent the sample email through Postmark's SMTP server from a subdomain of a low-volume test domain. The receiving checks passed SPF, DKIM and DMARC, each aligned with the From domain; the domain publishes a DMARC policy of `p=none`. Four Microsoft 365 seeds put the email in the Focused inbox and three Gmail Workspace seeds put it in the Updates tab. Both Gmail Consumer seeds, the other two Gmail Workspace seeds and the Outlook Personal seed put it in spam, so the script exited with code 1. One Microsoft 365 seed had not reported after 10 minutes and is listed as missing, not inbox.

Passing authentication doesn't guarantee the inbox. Providers also weigh the sending domain's history and the content, and a test domain has little history. Your results will reflect your own domain, ESP and email.

| Column | Meaning |
| --- | --- |
| Inbox | The seed found it in the inbox: Gmail Primary, or the Outlook inbox, including Focused. |
| Tab | Delivered to a Gmail category tab such as Promotions or Updates. Not spam, so it doesn't fail the build, but it isn't Primary either. |
| Spam | Spam, junk or bulk folder. Fails the build for gated providers. |
| Missing | The seed didn't receive the email, or hadn't reported when the wait ended. Never counted as inbox. |
| Other | Delivered to another folder. |
| Gated | Whether this provider counts toward the build result. |

Gmail Consumer and Outlook Personal are personal mailboxes; Gmail Workspace and Microsoft 365 are business mailboxes. Their filters can treat the same email differently, so the table keeps them apart.

| Exit code | Meaning |
| --- | --- |
| 0 | No Gmail or Outlook seed reported spam. Missing seeds are listed and not counted as inbox. |
| 1 | At least one Gmail or Outlook seed reported spam or junk. |
| 2 | No evidence to judge: no gated seeds in the test, every gated seed missing, or a missing seed with `PLACEMENT_FAIL_ON_MISSING=true`. |
| 3 | Setup or send error, such as a missing setting, an SMTP failure or a MailSlurp API error. |

The full report, with the authentication, DNS and content checks for the delivered email, is at the `Full report` link in the output. It needs a MailSlurp login.

## In GitHub Actions

[.github/workflows/inbox-placement-ci.yml](../.github/workflows/inbox-placement-ci.yml) has two jobs. `unit` runs the typecheck and the offline tests in [test/placement.test.ts](test/placement.test.ts) on pushes and pull requests that change this example; it needs no secrets. `placement` runs the real test and in this repository runs only when started by hand from the Actions tab.

To use it in your repository, copy this folder and the workflow, then add:

- secrets `MAILSLURP_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASS`;
- variables `FROM_EMAIL` and, if you want them, `FROM_NAME`, `PLACEMENT_GATE_PROVIDERS` and `PLACEMENT_FAIL_ON_MISSING`.

Run the placement job when the things it measures change, not on every pull request, since each run uses a test. For example, on pushes to your main branch that touch email templates or sending configuration, and by hand before a release:

```yaml
on:
  push:
    branches: [main]
    paths:
      - "emails/**"
  workflow_dispatch:
```

The job writes the provider table to the run's summary page and uploads `placement-report.json` as an artifact. Its `concurrency` group queues a second run instead of cancelling the one in progress, which would still have used its test.

## Troubleshooting

| Where it stops | What to check |
| --- | --- |
| `Set SMTP_HOST` or another `Set ...` message | That setting is empty. Nothing was created or sent. |
| An SMTP error before `Created inbox placement test` | Host, port, `SMTP_SECURE` and login. Nothing was created or sent. |
| `MailSlurp API error 426` | The account has no inbox placement tests available. Check your plan on the MailSlurp billing page. |
| An SMTP error after `Created inbox placement test` | The ESP rejected a message, often because the From domain isn't verified with it. The test was used; fix the sender and run again. |
| Every seed missing (exit 2) | Check the ESP's activity log for the seed messages, and that the subject still ends with the token. An ESP suppression list can drop seed addresses that bounced before. |
| Some seeds missing | Seeds can be slow or the provider can drop the message. Open the full report, or raise `PLACEMENT_TIMEOUT_SECONDS`. |

## Files

- [src/run.ts](src/run.ts): creates the test, sends, waits and sets the exit code.
- [src/send.ts](src/send.ts): the SMTP transport and the per-seed send.
- [src/placement.ts](src/placement.ts): classification, the gate and the report formats.
- [test/placement.test.ts](test/placement.test.ts): offline tests with result shapes from a real run.
- [templates/sample-email.html](templates/sample-email.html): the default test email.

For the same API in Python, Java and C#, see [documentation-inbox-placement](../documentation-inbox-placement/) and the [inbox placement docs](https://www.mailslurp.com/docs/inbox-placement/).
