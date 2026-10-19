# Device rendering in Python and JavaScript

Both scripts upload an EML file, start one render run, poll for completion, fetch
the results, and download the screenshot assets. They call the REST API directly
and need no third-party packages. Use Python 3.9+ or Node.js 22+.

Set `MAILSLURP_API_KEY` (or `API_KEY`) to a MailSlurp account key with device
rendering access, then run either example from this directory:

```sh
export MAILSLURP_API_KEY=your-api-key
python3 python-device-render.py
# Or run the same flow in JavaScript:
node javascript-device-render.mjs
```

The Makefile loads `API_KEY` or `MAILSLURP_API_KEY` from the repository's `../.env`
file. Run either example, or both:

```sh
make test-python
make test-javascript
make test # Runs both examples, creating two render runs.
```

With no arguments, each script uploads `sample.eml` and renders the
`gmail_chromium_web` target. To use your own EML and select one or more targets:

```sh
python3 python-device-render.py message.eml gmail_chromium_web outlook_android_emulator_dark
node javascript-device-render.mjs message.eml gmail_chromium_web outlook_android_emulator_dark
```

With Make, pass those arguments as
`make test-python ARGS="message.eml gmail_chromium_web"` (or `test-javascript`).

Use target keys from the [current target catalog](https://www.mailslurp.com/docs/device-rendering-profiles/).
Each invocation creates a new render and uses the account's rendering allowance.

The scripts follow the same sequence:

1. POST the original EML bytes to `/emails/device-previews/import/raw` with
   `Content-Type: message/rfc822` and the selected `targets`. This imports the
   message and starts its render in one request.
2. Poll `/emails/device-previews/{runId}/wait` in waits of up to 60 seconds, for up
   to ten minutes overall.
3. Fetch `/emails/device-previews/{runId}/results` and save `results.json` to
   `render-artifacts/<run-id>/`.
4. Download every screenshot's signed `accessUrl` into the same directory as a
   PNG, without sending the account API key to the asset host.

Incomplete runs retain their metadata and available screenshots, then exit with
an error. A successful run requires every selected target's primary screenshot.
The printed run ID identifies the remote run if polling times out; the timeout
does not cancel it.

See the [source/import guide](https://www.mailslurp.com/docs/device-rendering-sources/)
and [wait/results API guide](https://www.mailslurp.com/docs/device-rendering-ci/).
