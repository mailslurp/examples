import base64
from contextlib import redirect_stderr, redirect_stdout
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import render_email


RUN_ID = "11111111-1111-4111-8111-111111111111"
EMAIL_ID = "22222222-2222-4222-8222-222222222222"
TARGETS = ["gmail_chromium_web", "outlook_android_emulator_dark"]
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jNn0AAAAASUVORK5CYII="
)


class RenderEmailTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.output = Path(self.directory.name) / "artifacts"
        self.html = Path(self.directory.name) / "message.html"
        self.html.write_text("<h1>Order confirmed</h1>", encoding="utf-8")
        self.mode = "complete"
        self.requests = []
        self.clock = 0
        self.wait_count = 0
        fixture = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass

            def do_POST(self):
                self.do_GET()

            def do_GET(self):
                parsed = urlparse(self.path)
                length = int(self.headers.get("Content-Length", 0))
                raw = self.rfile.read(length)
                content_type = self.headers.get("Content-Type")
                body = raw if content_type == "message/rfc822" else (json.loads(raw) if raw else None)
                fixture.requests.append({
                    "method": self.command, "path": parsed.path,
                    "query": parse_qs(parsed.query), "body": body,
                    "key": self.headers.get("x-api-key"), "content_type": content_type,
                })
                status = 200
                if parsed.path == "/device-preview-targets":
                    data = {"targets": [
                        {"target": target, "platform": "web", "appearance": "light"}
                        for target in TARGETS
                    ]}
                elif self.command == "POST":
                    if fixture.mode == "denied":
                        status, data = 426, {"message": "DevicePreview subscription required"}
                    else:
                        data = {"run": {"runId": RUN_ID}, "created": True}
                elif parsed.path.endswith("/wait"):
                    fixture.wait_count += 1
                    fixture.clock += int(parse_qs(parsed.query)["timeoutMillis"][0]) / 1000
                    timed_out = fixture.mode == "timeout" or fixture.wait_count == 1
                    data = {"timedOut": timed_out, "run": {
                        "runId": RUN_ID, "status": "CAPTURING" if timed_out else "COMPLETE",
                    }}
                    if not timed_out and fixture.mode == "partial-wait":
                        data["run"]["status"] = "PARTIAL_COMPLETE"
                elif parsed.path.endswith("/results"):
                    data = fixture.results()
                elif parsed.path.startswith("/images/"):
                    if fixture.mode == "download-failure" and parsed.path.endswith("1.png"):
                        status, data = 503, {"message": "Image temporarily unavailable"}
                    else:
                        self.send_response(200)
                        self.send_header("Content-Type", "image/png")
                        self.end_headers()
                        self.wfile.write(PNG)
                        return
                else:
                    status, data = 404, {"message": "Unexpected endpoint"}
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(data).encode())

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)
        thread.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.origin = f"http://127.0.0.1:{self.server.server_port}"
        for mocked in (
            patch.object(render_email, "API_URL", self.origin),
            patch.dict(os.environ, {"MAILSLURP_API_KEY": "local-fixture-key"}),
            patch.object(render_email.time, "monotonic", side_effect=lambda: self.clock),
        ):
            mocked.start()
            self.addCleanup(mocked.stop)

    def results(self):
        result = {
            "run": {"runId": RUN_ID, "status": "COMPLETE"},
            "targets": [
                {"clientProfile": target, "status": "READY", "primaryScreenshotId": f"image-{index}"}
                for index, target in enumerate(TARGETS)
            ],
            "screenshots": [
                {"screenshotId": f"image-{index}", "accessUrl": f"{self.origin}/images/{index}.png"}
                for index in range(2)
            ],
        }
        if self.mode == "partial":
            result["run"]["status"] = "PARTIAL_COMPLETE"
            result["targets"][1].update(status="NEEDS_INTERVENTION", failureCode="capture_incomplete")
        elif self.mode == "missing":
            result["targets"].pop()
        elif self.mode == "missing-image":
            result["screenshots"][1]["accessUrl"] = None
        elif self.mode == "timeout":
            result["run"]["status"] = "CAPTURING"
        return result

    def invoke(self, *args):
        stdout, stderr = io.StringIO(), io.StringIO()
        with redirect_stdout(stdout), redirect_stderr(stderr):
            code = render_email.main([*args, "--output-dir", str(self.output)])
        return code, stdout.getvalue(), stderr.getvalue()

    def render(self, *source):
        return self.invoke("render", *(source or ["--html", str(self.html)]),
                           "--target", TARGETS[0], "--target", TARGETS[1])

    def test_html_render_waits_and_saves_screenshots_and_gallery(self):
        code, stdout, stderr = self.render()
        self.assertEqual(code, 0, stderr)
        self.assertIn(RUN_ID, stdout)
        self.assertIn("index.html", stdout)
        posts = [request for request in self.requests if request["method"] == "POST"]
        self.assertEqual(len(posts), 1)
        self.assertEqual(posts[0]["path"], "/emails/device-previews/import/html")
        self.assertEqual(posts[0]["body"]["html"], "<h1>Order confirmed</h1>")
        self.assertEqual(posts[0]["body"]["options"], {"targets": TARGETS})
        waits = [request for request in self.requests if request["path"].endswith("/wait")]
        self.assertEqual(len(waits), 2)
        self.assertTrue(all(1000 <= int(request["query"]["timeoutMillis"][0]) <= 60000 for request in waits))
        folder = self.output / RUN_ID
        self.assertEqual((folder / "image-0.png").read_bytes(), PNG)
        self.assertEqual((folder / "image-1.png").read_bytes(), PNG)
        self.assertIn('src="image-0.png"', (folder / "index.html").read_text())
        self.assertEqual(json.loads((folder / "request.json").read_text())["targets"], TARGETS)
        for request in self.requests:
            authenticated = request["path"].startswith("/emails/")
            self.assertEqual(request["key"], "local-fixture-key" if authenticated else None)

    def test_eml_import_preserves_raw_mime_bytes_and_repeated_targets(self):
        eml = Path(self.directory.name) / "message with spaces.eml"
        raw = b"Subject: MIME test\r\nContent-Type: text/plain; charset=iso-8859-1\r\n\r\nCaf\xe9\r\n"
        eml.write_bytes(raw)
        code, _, stderr = self.render("--eml", str(eml))
        self.assertEqual(code, 0, stderr)
        posts = [request for request in self.requests if request["method"] == "POST"]
        self.assertEqual(len(posts), 1)
        self.assertEqual(posts[0]["path"], "/emails/device-previews/import/raw")
        self.assertEqual(posts[0]["body"], raw)
        self.assertEqual(posts[0]["content_type"], "message/rfc822")
        self.assertEqual(posts[0]["query"]["targets"], TARGETS)
        self.assertEqual(posts[0]["query"]["sourceAlias"], [eml.name])

    def test_final_results_status_is_reported_after_a_transient_wait_snapshot(self):
        self.mode = "partial-wait"
        code, stdout, stderr = self.render()
        self.assertEqual(code, 0, stderr)
        self.assertIn("PARTIAL_COMPLETE", stdout)
        self.assertIn(f"Final run {RUN_ID}: COMPLETE (2 targets, 2 screenshots)", stdout)
        self.assertEqual(sum(request["method"] == "POST" for request in self.requests), 1)

    def test_stored_email_uses_the_email_endpoint(self):
        code, _, stderr = self.render("--email-id", EMAIL_ID)
        self.assertEqual(code, 0, stderr)
        post = next(request for request in self.requests if request["method"] == "POST")
        self.assertEqual(post["path"], f"/emails/{EMAIL_ID}/device-previews")
        self.assertEqual(post["body"], {"targets": TARGETS})

    def test_partial_missing_and_download_failures_retain_evidence(self):
        for mode in ("partial", "missing", "missing-image", "download-failure"):
            with self.subTest(mode=mode):
                self.mode = mode
                code, _, stderr = self.render()
                self.assertEqual(code, 1)
                self.assertTrue(stderr)
                self.assertTrue((self.output / RUN_ID / "results.json").exists())
                self.assertTrue((self.output / RUN_ID / "index.html").exists())
                self.assertEqual((self.output / RUN_ID / "image-0.png").read_bytes(), PNG)

    def test_timeout_then_resume_does_not_create_another_run(self):
        self.mode = "timeout"
        code, _, _ = self.render()
        self.assertEqual(code, 1)
        self.assertEqual(self.wait_count, 10)
        self.mode = "complete"
        code, _, stderr = self.invoke("wait", RUN_ID)
        self.assertEqual(code, 0, stderr)
        self.assertEqual(sum(request["method"] == "POST" for request in self.requests), 1)

    def test_results_command_reads_without_creating_or_waiting(self):
        code, _, stderr = self.invoke("results", RUN_ID)
        self.assertEqual(code, 0, stderr)
        self.assertTrue(all(request["method"] == "GET" for request in self.requests))
        self.assertFalse(any(request["path"].endswith("/wait") for request in self.requests))

    def test_resume_uses_saved_target_selection_to_detect_missing_targets(self):
        self.render()
        self.mode = "missing"
        code, _, stderr = self.invoke("results", RUN_ID)
        self.assertEqual(code, 1)
        self.assertIn(TARGETS[1], stderr)

    def test_catalog_does_not_need_an_api_key(self):
        with patch.dict(os.environ, {}, clear=True), redirect_stdout(io.StringIO()) as output:
            self.assertEqual(render_email.main(["targets"]), 0)
        self.assertIn(TARGETS[0], output.getvalue())
        self.assertIsNone(self.requests[0]["key"])

    def test_unknown_target_never_creates_a_run(self):
        with self.assertRaisesRegex(ValueError, "Unknown targets"):
            self.invoke("render", "--html", str(self.html), "--target", "unknown_client")
        self.assertFalse(any(request["method"] == "POST" for request in self.requests))

    def test_subscription_error_does_not_retry_creation(self):
        self.mode = "denied"
        with self.assertRaisesRegex(RuntimeError, "426.*DevicePreview"):
            self.render()
        self.assertEqual(sum(request["method"] == "POST" for request in self.requests), 1)

    def test_gallery_escapes_labels_and_failure_codes(self):
        result = self.results()
        result["targets"][0].update(clientProfile='<script>alert("label")</script>', failureCode="<iframe>")
        render_email.save_results(result, self.output, [])
        gallery = (self.output / "index.html").read_text()
        self.assertNotIn("<script>", gallery)
        self.assertNotIn("<iframe>", gallery)
        self.assertIn("&lt;script&gt;", gallery)
        self.assertIn("&lt;iframe&gt;", gallery)


if __name__ == "__main__":
    unittest.main()
