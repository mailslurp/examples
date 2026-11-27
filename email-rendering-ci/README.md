# Render your emails on real clients in CI

A Node.js script and GitHub Actions workflow that render an HTML email on real email clients and devices with [MailSlurp device previews](https://www.mailslurp.com/docs/device-renders/), save a screenshot from each one, and fail the job when [Email Audit](https://www.mailslurp.com/docs/email-audit/) finds a broken link or image.

It's meant for the emails your code sends: sign-up confirmations, password resets, receipts and notifications built with React Email, MJML, Maizzle or plain HTML. A template change that looks fine in your browser can break in classic Outlook or turn unreadable in dark mode. Seeing every client before the change merges is quicker than finding out from a customer's screenshot.

Each run:

1. starts a device preview run from your built HTML with `POST /emails/device-previews/import/html`;
2. waits, up to a time limit, for each client to capture a screenshot;
3. downloads the screenshots and creates a share link that reviewers can open without a MailSlurp login;
4. runs Email Audit on the same HTML and exits with code 1 if it finds a broken link or image.

The screenshots are for a person to review. The script fails the build on problems a screenshot can't show, such as a link that returns 404, and leaves the visual judgement to the reviewer.

## What a run looks like

Here is the output of a real run of the sample template:

```text
Started render bebbd90e-6fcc-4251-9f30-b9e8d798e805 for confirm-email.html on all clients
  COMPLETE: 16 of 16 screenshots
Render COMPLETE after 56s

Client             Platform  Mode   Status  Screenshot
-----------------  --------  -----  ------  ---------------------------------
Apple Mail         iPad      light  READY   ipados_mail_physical_device.png
Apple Mail         iPhone    dark   READY   ios_mail_physical_device_dark.png
Apple Mail         iPhone    light  READY   ios_mail_physical_device.png
Apple Mail         macOS     light  READY   apple_mail_macos.png
Gmail              Android   dark   READY   gmail_android_emulator_dark.png
Gmail              Android   light  READY   gmail_android_emulator.png
Gmail              iPhone    light  READY   gmail_ios_physical_device.png
Gmail              web       dark   READY   gmail_chromium_web_dark.png
Gmail              web       light  READY   gmail_chromium_web.png
Outlook            Android   dark   READY   outlook_android_emulator_dark.png
Outlook            Android   light  READY   outlook_android_emulator.png
Outlook            iPhone    light  READY   outlook_ios_physical_device.png
Outlook            web       light  READY   outlook_chromium_web.png
Outlook (classic)  Windows   light  READY   outlook_classic_windows.png
Outlook (new)      Windows   light  READY   outlook_new_windows.png
Yahoo Mail         web       light  READY   yahoo_chromium_web.png

Email Audit: FAILED, health score 46
  No broken links detected in checked URLs.
  Found 6 feature(s) with unsupported clients.
  Found 6 feature(s) with partial/unknown support.
  HTML validation passed with no errors.

PASS: 16 of 16 clients rendered and the audit found no broken links or images.
Screenshots for review (no login needed): https://api.mailslurp.com/emails/device-previews/share/<token>/preview
Full results (MailSlurp login): https://app.mailslurp.com/device-previews/bebbd90e-6fcc-4251-9f30-b9e8d798e805
```

The build passed because every client rendered and no link or image was broken. Email Audit's own status counts client support for the HTML and CSS the email uses, including basic elements that some older clients rewrite, so read its notes rather than treating its status as the build result.

The screenshots still found two problems in the sample, which is why a person should look at them:
- **Classic Outlook for Windows** ignored the padding on the button's link, so "Confirm email address" showed as highlighted text instead of a button. Put the padding on the table cell, or use a padded table around the link, for Word-based Outlook.
- **Apple Mail on iPhone in dark mode** applied the dark card style but kept the inline grey (`#52525b`) on the footer text, which became hard to read. Give secondary text a class and set its dark-mode colour in the `prefers-color-scheme: dark` block too.

The sample keeps both problems so you can see them in your own run.

## Run it locally

You need Node.js 22.18 or later and a MailSlurp API key for an account with device previews.

```sh
npm ci
export MAILSLURP_API_KEY=your-api-key
npm run render
```

With no settings it renders [templates/confirm-email.html](templates/confirm-email.html) on every client your plan includes. Point it at your own built HTML:

```sh
EMAIL_HTML_FILE=dist/emails/password-reset.html EMAIL_SUBJECT="Reset your password" npm run render
```

| Setting | Required | Meaning |
| --- | --- | --- |
| `MAILSLURP_API_KEY` | yes | Your MailSlurp API key. |
| `EMAIL_HTML_FILE` | no | The built HTML email to render. Defaults to the sample template. |
| `EMAIL_SUBJECT` | no | Subject line shown with the render and used by the audit. |
| `RENDER_TARGETS` | no | Comma-separated target IDs to render, such as `gmail_chromium_web,ios_mail_physical_device`. Defaults to every client your plan includes. |
| `RENDER_TIMEOUT_SECONDS` | no | How long to wait for screenshots. Defaults to 600. |
| `RENDER_SHARE_LINK` | no | `false` skips the share link. Defaults to creating one that expires after 30 days. |
| `RENDER_AUDIT` | no | `false` skips Email Audit. |
| `RENDER_FAIL_ON_INCOMPLETE` | no | `true` also fails the build when any client didn't render. Defaults to `false`. |
| `RENDER_OUTPUT_DIR` | no | Where screenshots and `results.json` are saved. Defaults to `render-artifacts/`. |
| `RENDER_REPORT_FILE` | no | Writes the result as JSON. |
| `FROM_EMAIL` | no | From address passed to the audit. |

To see which target IDs your account can use, call `GET /emails/device-previews/native-targets/availability` or open device previews in the dashboard.

A share link lets anyone who has it see the screenshots until it expires. That suits templates with sample data; set `RENDER_SHARE_LINK=false` if your rendered HTML contains anything private.

## How the script works

Start the render from the HTML file ([src/run.ts](src/run.ts)):

```ts
const { run } = await previews.createDevicePreviewRunFromHtmlImport({
  createDevicePreviewHtmlImportOptions: {
    html,
    subject,
    sourceAlias: 'email-rendering-ci',
    options: targets.length > 0 ? { targets } : { allTargets: true },
  },
});
```

Wait in rounds with `waitForDevicePreviewRun`, which holds on the server for up to 60 seconds each time, then read `getDevicePreviewRunResults`. Each target has a client, a platform, a light or dark colour scheme and a status: `READY` when its screenshot was captured, or `FAILED`, `TIMED_OUT` and similar when it wasn't. The screenshots have signed `accessUrl`s, so downloading them needs no API key.

Audit the same HTML:

```ts
const created = await audits.createEmailAudit({
  createEmailAuditOptions: { subject, fromAddress: env.FROM_EMAIL || undefined, htmlBody: html },
});
```

[src/report.ts](src/report.ts) turns the targets and the audit into the table, the job summary and the exit code.

| Exit code | Meaning |
| --- | --- |
| 0 | At least one client rendered and the audit found no broken links or images. Clients that didn't render are listed. |
| 1 | Email Audit found a broken link or image. |
| 2 | No client rendered, or a client didn't render and `RENDER_FAIL_ON_INCOMPLETE=true`. |
| 3 | Setup or API error, such as a missing API key or an unreadable HTML file. |

## In GitHub Actions

[.github/workflows/email-rendering-ci.yml](../.github/workflows/email-rendering-ci.yml) has two jobs. `unit` runs the typecheck and the offline tests in [test/report.test.ts](test/report.test.ts) on pushes and pull requests that change this example; it needs no secrets. `render` renders the sample template, and in this repository runs only when started by hand.

To use it in your repository, copy this folder and the workflow, add the `MAILSLURP_API_KEY` secret, and build your templates before the render step. Run it on pull requests that change the email templates:

```yaml
on:
  pull_request:
    paths:
      - "emails/**"
```

The job writes the table and the share link to the run's summary page, and uploads the screenshots as an artifact. Each run uses one render from your plan.

## Files

- [src/run.ts](src/run.ts): starts the render, waits, saves the screenshots, audits and sets the exit code.
- [src/report.ts](src/report.ts): the target summary, the gate and the report formats.
- [test/report.test.ts](test/report.test.ts): offline tests with recorded result shapes.
- [templates/confirm-email.html](templates/confirm-email.html): the sample sign-up confirmation email, with dark-mode styles.

For the same API in Python, Java and C#, see [documentation-device-rendering](../documentation-device-rendering/). To check where an email lands rather than how it looks, see [inbox-placement-ci](../inbox-placement-ci/).
