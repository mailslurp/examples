"""Render an email with MailSlurp, wait for the job, and save a local gallery."""

import argparse
from html import escape
import json
import os
from pathlib import Path
import sys
import time
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from uuid import UUID


API_URL = "https://api.mailslurp.com"


def api(path, api_key=None, body=None, content_type="application/json"):
    headers = {"Accept": "application/json"}
    if api_key:
        headers["x-api-key"] = api_key
    if body is not None:
        headers["Content-Type"] = content_type
    request = Request(
        API_URL + path,
        data=body if isinstance(body, bytes) else (
            None if body is None else json.dumps(body).encode("utf-8")
        ),
        headers=headers,
    )
    try:
        # The longest server wait below is 60 seconds.
        with urlopen(request, timeout=70) as response:
            return json.load(response)
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MailSlurp HTTP {error.code}: {detail}") from error


def wait_for_run(run_id, api_key, timeout_seconds):
    deadline = time.monotonic() + timeout_seconds
    while True:
        remaining_ms = int((deadline - time.monotonic()) * 1000)
        if remaining_ms < 1000:
            return
        waited = api(
            f"/emails/device-previews/{run_id}/wait"
            f"?timeoutMillis={min(60_000, remaining_ms)}&pollIntervalMillis=1000",
            api_key,
        )
        print(f"Run {run_id}: {waited['run']['status']}", flush=True)
        if not waited["timedOut"]:
            return


def save_results(results, output, required_targets):
    """Retain diagnostics and successful downloads even when coverage is incomplete."""
    output.mkdir(parents=True, exist_ok=True)
    (output / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    downloaded = {}
    errors = []
    for screenshot in results["screenshots"]:
        screenshot_id = screenshot["screenshotId"]
        url = screenshot.get("accessUrl")
        if not url:
            errors.append(f"Screenshot {screenshot_id} has no download URL")
            continue
        filename = quote(screenshot_id, safe="") + ".png"
        try:
            # Signed URLs authorize the download. Never forward the account API key.
            with urlopen(url, timeout=60) as response:
                (output / filename).write_bytes(response.read())
            downloaded[screenshot_id] = filename
        except OSError as error:
            errors.append(f"Could not download screenshot {screenshot_id}: {error}")

    ready = {
        target["clientProfile"]
        for target in results["targets"]
        if target["status"] == "READY" and target.get("primaryScreenshotId") in downloaded
    }
    missing = set(required_targets) - ready
    if results["run"]["status"] != "COMPLETE":
        errors.append(f"Run status is {results['run']['status']}")
    if not results["targets"]:
        errors.append("The run has no target results")
    if missing:
        errors.append(f"Incomplete targets: {', '.join(sorted(missing))}")

    sections = []
    for target in results["targets"]:
        label = target.get("clientProfile") or target["targetId"]
        sections.append(f"<section><h2>{escape(label)}</h2><p>{escape(target['status'])}</p>")
        if target.get("failureCode"):
            sections.append(f"<p>{escape(target['failureCode'])}</p>")
        filename = downloaded.get(target.get("primaryScreenshotId"))
        if filename:
            href = quote(filename)
            sections.append(
                f'<a href="{href}"><img src="{href}" alt="{escape(label, quote=True)}" '
                'loading="lazy"></a>'
            )
        sections.append("</section>")
    error_html = "".join(f"<li>{escape(error)}</li>" for error in errors)
    gallery = f"""<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Email render results</title>
<style>body{{font:16px system-ui;margin:2rem auto;padding:0 1rem;max-width:1000px}}
img{{display:block;max-width:100%;height:auto}}section{{border-top:1px solid #ccc;margin:2rem 0}}</style>
<h1>Email render results</h1>
<p>Run {escape(results['run']['runId'])}: {escape(results['run']['status'])}</p>
<p><a href="results.json">Full results JSON</a></p>
<ul>{error_html}</ul>
{''.join(sections)}
</html>
"""
    (output / "index.html").write_text(gallery, encoding="utf-8")
    return errors


def uuid_string(value):
    try:
        return str(UUID(value))
    except ValueError as error:
        raise argparse.ArgumentTypeError("Use the UUID returned by MailSlurp") from error


def positive_seconds(value):
    seconds = int(value)
    if seconds < 1:
        raise argparse.ArgumentTypeError("Timeout must be at least one second")
    return seconds


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("targets", help="List supported client targets; no API key required")
    render = commands.add_parser("render", help="Create a run, wait, and save screenshots")
    source = render.add_mutually_exclusive_group(required=True)
    source.add_argument("--html", type=Path, help="UTF-8 HTML file")
    source.add_argument("--eml", type=Path, help="Raw RFC822/MIME .eml file (bytes preserved)")
    source.add_argument("--email-id", type=uuid_string, help="ID of an email already in MailSlurp")
    render.add_argument("--subject", default="Email rendering check")
    wait = commands.add_parser("wait", help="Wait for an existing run and save its results")
    results = commands.add_parser("results", help="Save current results without waiting")
    for command in (wait, results):
        command.add_argument("run_id", type=uuid_string)
    for command in (render, wait, results):
        command.add_argument(
            "--target", action="append", required=command is render,
            help="Required catalog target ID; repeat for each client",
        )
        command.add_argument("--output-dir", type=Path, default=Path("render-artifacts"))
    for command in (render, wait):
        command.add_argument("--timeout-seconds", type=positive_seconds, default=600)
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    if args.command == "targets":
        for target in api("/device-preview-targets")["targets"]:
            print(target["target"], target["platform"], target["appearance"])
        return 0

    api_key = os.environ.get("MAILSLURP_API_KEY")
    if not api_key:
        raise RuntimeError("Set MAILSLURP_API_KEY to the rendering account's API key")
    required_targets = set(args.target or [])
    if args.command == "render":
        catalog = api("/device-preview-targets")["targets"]
        unknown = required_targets - {target["target"] for target in catalog}
        if unknown:
            raise ValueError(f"Unknown targets: {sorted(unknown)}")
        options = {"targets": sorted(required_targets)}
        if args.eml:
            # Send original MIME bytes; do not decode/re-encode or reconstruct the email.
            query = urlencode({"targets": sorted(required_targets), "sourceAlias": args.eml.name}, doseq=True)
            created = api("/emails/device-previews/import/raw?" + query, api_key,
                          args.eml.read_bytes(), content_type="message/rfc822")
        elif args.html:
            created = api("/emails/device-previews/import/html", api_key, {
                "html": args.html.read_text(encoding="utf-8"),
                "subject": args.subject,
                "options": options,
            })
        else:
            created = api(f"/emails/{args.email_id}/device-previews", api_key, options)
        run_id = uuid_string(created["run"]["runId"])
        print(f"Created run {run_id}", flush=True)
    else:
        run_id = args.run_id

    output = args.output_dir / run_id
    output.mkdir(parents=True, exist_ok=True)
    request_file = output / "request.json"
    if args.command == "render":
        request_file.write_text(json.dumps({
            "runId": run_id, "targets": sorted(required_targets),
        }, indent=2), encoding="utf-8")
    elif not required_targets and request_file.exists():
        required_targets = set(json.loads(request_file.read_text(encoding="utf-8"))["targets"])

    errors = []
    if args.command != "results":
        try:
            wait_for_run(run_id, api_key, args.timeout_seconds)
        except (OSError, RuntimeError) as error:
            # Try to retain results even if the wait request failed.
            errors.append(f"Wait failed: {error}")
    results = api(f"/emails/device-previews/{run_id}/results", api_key)
    if not required_targets:
        required_targets = {target["clientProfile"] for target in results["targets"]}
    errors.extend(save_results(results, output, required_targets))
    print(f"Final run {run_id}: {results['run']['status']} "
          f"({len(results['targets'])} targets, {len(results['screenshots'])} screenshots)")
    print(f"View screenshots: {(output / 'index.html').resolve().as_uri()}")
    for error in errors:
        print(error, file=sys.stderr)
    return 1 if errors else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, RuntimeError, ValueError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
