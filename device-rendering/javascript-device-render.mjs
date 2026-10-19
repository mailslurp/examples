import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const API_URL = "https://api.mailslurp.com";

export async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: node javascript-device-render.mjs [email.eml] [target ...]");
    console.log("Defaults: sample.eml, gmail_chromium_web. Set MAILSLURP_API_KEY or API_KEY.");
    return;
  }
  const apiKey = process.env.MAILSLURP_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Set MAILSLURP_API_KEY or API_KEY.");
  const emlPath = args[0] || fileURLToPath(new URL("./sample.eml", import.meta.url));
  const targets = args.length > 1 ? [...new Set(args.slice(1))] : ["gmail_chromium_web"];

  async function api(path, body) {
    const response = await fetch(API_URL + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "message/rfc822" }),
      },
      body,
      signal: AbortSignal.timeout(70_000),
    });
    if (!response.ok) {
      throw new Error(`MailSlurp HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  // 1. Upload the original EML bytes and start a render for the requested targets.
  const query = new URLSearchParams({ sourceAlias: basename(emlPath) });
  for (const target of targets) query.append("targets", target);
  const created = await api(`/emails/device-previews/import/raw?${query}`, await readFile(emlPath));
  const runId = created.run.runId;
  if (!runId) throw new Error("The import did not return a run ID.");
  console.log(`Created run ${runId}`);
  const runPath = `/emails/device-previews/${encodeURIComponent(runId)}`;
  const errors = [];

  // 2. Each wait call polls on the server; repeat up to a total of ten minutes.
  const deadline = performance.now() + 600_000;
  let timedOut = true;
  try {
    while (performance.now() < deadline) {
      const remaining = Math.floor(deadline - performance.now());
      if (remaining < 1_000) break;
      const waitQuery = new URLSearchParams({
        timeoutMillis: String(Math.min(60_000, remaining)),
        pollIntervalMillis: "2000",
      });
      const waited = await api(`${runPath}/wait?${waitQuery}`);
      console.log(`Run ${runId}: ${waited.run.status}`);
      if (!waited.timedOut) {
        timedOut = false;
        break;
      }
    }
    if (timedOut) errors.push("The render did not finish within ten minutes.");
  } catch (error) {
    errors.push(`Wait failed: ${error.message}`);
  }

  // 3. Keep the current results even if waiting failed or some targets failed.
  const results = await api(`${runPath}/results`);
  const output = resolve("render-artifacts", encodeURIComponent(runId));
  await mkdir(output, { recursive: true });
  await writeFile(join(output, "results.json"), JSON.stringify(results, null, 2) + "\n");

  // 4. Download screenshot assets using their signed URLs, without the API key.
  const downloaded = new Set();
  for (const screenshot of results.screenshots) {
    const screenshotId = screenshot.screenshotId;
    try {
      if (!screenshot.accessUrl) throw new Error("No accessUrl was returned");
      const response = await fetch(screenshot.accessUrl, { signal: AbortSignal.timeout(70_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) throw new Error("The screenshot was empty");
      const filename = `${encodeURIComponent(screenshotId)}.png`;
      await writeFile(join(output, filename), bytes);
      downloaded.add(screenshotId);
      console.log(`Saved ${filename}`);
    } catch (error) {
      errors.push(`Screenshot ${screenshotId}: ${error.message}`);
    }
  }

  if (results.run.status !== "COMPLETE") errors.push(`Run status is ${results.run.status}`);
  if (!results.screenshots.length) errors.push("No screenshots were returned.");
  for (const target of results.targets) {
    if (target.status !== "READY") {
      errors.push(`Target ${target.clientProfile}: ${target.status}`);
    } else if (!downloaded.has(target.primaryScreenshotId)) {
      errors.push(`Target ${target.clientProfile} has no downloaded primary screenshot.`);
    }
  }
  const returnedTargets = new Set(results.targets.map((target) => target.clientProfile));
  for (const target of targets) {
    if (!returnedTargets.has(target)) errors.push(`Missing target: ${target}`);
  }
  console.log(`Results and assets: ${output}`);
  if (errors.length) throw new Error(errors.join("\n"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
