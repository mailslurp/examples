# Python device rendering

Render a raw EML file, an HTML email or a message already stored in MailSlurp, wait for the render job, and view real client screenshots in a local gallery. This example uses Python 3.9 or later and the standard library: no packages need installing. It calls the current REST endpoints directly, so target selection and imports do not depend on an installed SDK release.

## Select targets and render an email

From this directory, list the supported client/platform/appearance combinations:

```sh
python3 render_email.py targets
```

Set `MAILSLURP_API_KEY` in your environment to the key for an account with device-rendering access. An active support-provided demo includes Standard and Premium targets. Live runs use the receiving account's rendering allowance; `make test` uses local fixtures and needs no account.

Submit the included HTML email to two explicit targets from the catalog:

```sh
python3 render_email.py render --html sample.html \
  --target gmail_chromium_web --target outlook_android_emulator_dark
```

To render your original RFC822/MIME email without changing its headers, encodings or MIME structure:

```sh
python3 render_email.py render --eml message.eml \
  --target gmail_chromium_web --target outlook_android_emulator_dark
```

This posts the original file bytes to `/emails/device-previews/import/raw` with `Content-Type: message/rfc822` and repeated `targets` query parameters.

Or render an email your application has already delivered to MailSlurp:

```sh
python3 render_email.py render --email-id "$MAILSLURP_EMAIL_ID" \
  --target gmail_chromium_web
```

`MAILSLURP_EMAIL_ID` is the `id` from a received email. See the [Python email-testing guide](https://www.mailslurp.com/docs/python-email-testing/) for creating an inbox and waiting for that message.

The script prints the run ID before polling. Each API wait lasts at most 60 seconds, with a 70-second HTTP timeout. Polling stops after ten minutes by default; use `--timeout-seconds 900` to allow fifteen minutes. The polling deadline does not cancel the remote run.

## View and resume results

Open the `file://` URL printed at the end, or open `render-artifacts/<run-id>/index.html` in a browser. Each client section shows its status, any failure code and its downloaded screenshot. Click a screenshot for its full image. The same directory contains:

- `request.json`: the original target selection, saved immediately after creation.
- `results.json`: run, target and screenshot metadata from the API.
- PNG files: available client screenshots, downloaded without forwarding the API key.
- `index.html`: a gallery that uses those local PNG files.

To continue a run after a process or CI timeout, use its printed run ID. These commands read the existing job and do not create another one:

```sh
python3 render_email.py wait "$MAILSLURP_RENDER_RUN_ID" --timeout-seconds 600
python3 render_email.py results "$MAILSLURP_RENDER_RUN_ID"
```

`wait` polls before downloading; `results` immediately saves the current state, including partial screenshots. Both reuse the original target selection when `request.json` is present. On another machine, pass the original `--target` options to check the same required coverage; otherwise they check the targets returned by the API. Use the same `--output-dir` when resuming if you changed it from `render-artifacts`.

## Use the result in CI

The command exits with code `0` only for a `COMPLETE` run with every required target ready and its primary screenshot downloaded. Partial, failed, timed-out, missing-target and failed-download results exit with code `1` after saving available evidence. Publish the artifact directory even when the command fails. Email content and signed screenshot URLs can be private; keep these artifacts private too.

Creation is never automatically retried. If a connection fails while submitting, inspect your account's run history before submitting again. For HTTP `426` or a `DevicePreview` subscription error, check the API key's account and its current demo/subscription access. For a capture failure, inspect each target's `failureCode` in `results.json` and the [target/access guide](https://www.mailslurp.com/docs/device-rendering-profiles/).

## Run the local checks

```sh
make test
# Or:
python3 -m unittest discover -s tests -v
```

The tests exercise the real HTTP request and file-writing code against a local HTTP server. They cover byte-preserving raw EML, HTML and stored-email creation, bounded repeated waits, resuming, screenshot downloads, gallery escaping, incomplete coverage, and subscription errors. They do not submit live render jobs.

See [rendering in CI](https://www.mailslurp.com/docs/device-rendering-ci/#python) for the documentation walkthrough, and [render_email.py](render_email.py) for the complete implementation.
