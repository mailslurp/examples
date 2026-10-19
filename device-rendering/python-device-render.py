"""Upload an EML, render it, poll for completion, and download the results."""

import json
import os
from pathlib import Path
import sys
import time
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


API_URL = "https://api.mailslurp.com"


def api(path, api_key, body=None):
    headers = {"x-api-key": api_key, "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "message/rfc822"
    request = Request(API_URL + path, data=body, headers=headers)
    try:
        # Allow each server-side wait (up to 60 seconds) time to return.
        with urlopen(request, timeout=70) as response:
            return json.load(response)
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MailSlurp HTTP {error.code}: {detail}") from error


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    if "--help" in args or "-h" in args:
        print("Usage: python3 python-device-render.py [message.eml] [target ...]")
        print("Defaults: sample.eml, gmail_chromium_web. Set MAILSLURP_API_KEY or API_KEY.")
        return 0
    eml = Path(args[0]) if args else Path(__file__).with_name("sample.eml")
    targets = list(dict.fromkeys(args[1:] or ["gmail_chromium_web"]))
    api_key = os.environ.get("MAILSLURP_API_KEY") or os.environ.get("API_KEY")
    if not api_key:
        raise RuntimeError("Set MAILSLURP_API_KEY or API_KEY")

    # Upload the original MIME bytes. This endpoint imports the EML and starts
    # one render run for the selected targets in the same request.
    query = urlencode({"sourceAlias": eml.name, "targets": targets}, doseq=True)
    created = api("/emails/device-previews/import/raw?" + query, api_key, eml.read_bytes())
    run_id = created["run"]["runId"]
    if not run_id:
        raise RuntimeError("The import did not return a run ID")
    run_path = "/emails/device-previews/" + quote(run_id, safe="")
    print(f"Created render {run_id}", flush=True)
    output = Path("render-artifacts") / quote(run_id, safe="")
    output.mkdir(parents=True, exist_ok=True)

    # Poll in bounded server-side waits, for up to ten minutes overall.
    # A timed-out wait does not cancel the remote run.
    errors = []
    timed_out = True
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        remaining_ms = int((deadline - time.monotonic()) * 1000)
        if remaining_ms < 1000:
            break
        query = urlencode({"timeoutMillis": min(60_000, remaining_ms), "pollIntervalMillis": 2000})
        try:
            waited = api(run_path + "/wait?" + query, api_key)
        except (OSError, RuntimeError) as error:
            errors.append(f"Wait failed: {error}")
            break
        print(f"Render {run_id}: {waited['run']['status']}", flush=True)
        if not waited["timedOut"]:
            timed_out = False
            break
    if timed_out and not errors:
        errors.append("Render did not finish within the polling deadline")

    # Fetch and save metadata even when a run is incomplete.
    results = api(run_path + "/results", api_key)
    (output / "results.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

    # Download screenshot assets using their signed URLs. These requests do not
    # need the account API key.
    downloaded = set()
    for screenshot in results["screenshots"]:
        screenshot_id = screenshot["screenshotId"]
        url = screenshot.get("accessUrl")
        if not url:
            errors.append(f"Screenshot {screenshot_id} has no download URL")
            continue
        try:
            with urlopen(url, timeout=60) as response:
                image = response.read()
            if not image:
                raise RuntimeError("Empty screenshot response")
            filename = quote(screenshot_id, safe="") + ".png"
            (output / filename).write_bytes(image)
            downloaded.add(screenshot_id)
        except (OSError, RuntimeError) as error:
            errors.append(f"Screenshot {screenshot_id}: {error}")

    ready = {
        target.get("clientProfile")
        for target in results["targets"]
        if target["status"] == "READY" and target.get("primaryScreenshotId") in downloaded
    }
    if results["run"]["status"] != "COMPLETE":
        errors.append(f"Run status is {results['run']['status']}")
    if set(targets) - ready:
        errors.append(f"Missing ready screenshots for: {', '.join(sorted(set(targets) - ready))}")
    print(f"Saved results and {len(downloaded)} screenshot(s) to {output.resolve()}")
    if errors:
        raise RuntimeError("\n".join(errors))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, RuntimeError, ValueError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
