// Renders an HTML email on real email clients and devices from CI, saves the screenshots, runs Email
// Audit and fails the build on broken links or images.
//
//   1. Start a device preview run from your built HTML.
//   2. Wait (bounded) for each client to capture a screenshot.
//   3. Download the screenshots and create a share link reviewers can open without logging in.
//   4. Run Email Audit on the same HTML and exit 1 on broken links or images, 2 if nothing rendered,
//      3 on a setup or API error.
import fs from 'node:fs';
import path from 'node:path';
import { Configuration, DevicePreviewsControllerApi, EmailAuditControllerApi } from 'mailslurp-client';
import type { DevicePreviewRunDto, DevicePreviewRunResultsDto } from 'mailslurp-client';
import { decide, formatAudit, formatMarkdown, formatTable, summarizeAudit, toTargetRow } from './report.ts';
import type { AuditSummary } from './report.ts';

const env = process.env;

function required(name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

async function main(): Promise<number> {
  const apiKey = required('MAILSLURP_API_KEY');
  const htmlFile = env.EMAIL_HTML_FILE || new URL('../templates/confirm-email.html', import.meta.url).pathname;
  const html = fs.readFileSync(htmlFile, 'utf8');
  const subject = env.EMAIL_SUBJECT || 'Confirm your email address';
  const targets = (env.RENDER_TARGETS || '').split(',').map(target => target.trim()).filter(Boolean);
  const timeoutSeconds = Number(env.RENDER_TIMEOUT_SECONDS || 600);
  if (!(timeoutSeconds > 0)) throw new Error('RENDER_TIMEOUT_SECONDS must be a positive number');
  const outDir = env.RENDER_OUTPUT_DIR || 'render-artifacts';

  const configuration = new Configuration({ apiKey });
  const previews = new DevicePreviewsControllerApi(configuration);
  const audits = new EmailAuditControllerApi(configuration);

  //<gen>rendering_ci_01_start_render
  // Render the built HTML directly; no inbox or send is needed. With no targets listed, MailSlurp
  // renders every client your plan includes, in light and dark mode where the client supports it.
  const { run } = await previews.createDevicePreviewRunFromHtmlImport({
    createDevicePreviewHtmlImportOptions: {
      html,
      subject,
      sourceAlias: 'email-rendering-ci',
      options: targets.length > 0 ? { targets } : { allTargets: true },
    },
  });
  //</gen>
  const reportUrl = `https://app.mailslurp.com/device-previews/${run.runId}`;
  console.log(`Started render ${run.runId} for ${path.basename(htmlFile)} on ${targets.length > 0 ? targets.join(', ') : 'all clients'}`);

  const startedWaiting = Date.now();
  const finished = await waitForRender(previews, run.runId, timeoutSeconds * 1000);
  console.log(`Render ${finished.status} after ${Math.round((Date.now() - startedWaiting) / 1000)}s`);

  const results = await previews.getDevicePreviewRunResults({ runId: run.runId });
  const files = await downloadScreenshots(results, path.join(outDir, run.runId));
  const rows = results.targets.map(target => toTargetRow(target, files.get(target.id) ?? null));

  //<gen>rendering_ci_03_share_link
  // A share link shows the screenshots without a MailSlurp login, so reviewers can open it from the
  // pull request. Anyone with the link can see them until it expires; set RENDER_SHARE_LINK=false to skip.
  let shareUrl: string | null = null;
  if (env.RENDER_SHARE_LINK !== 'false') {
    const link = await previews.createDevicePreviewShareLink({
      runId: run.runId,
      createDevicePreviewShareLinkOptions: {
        label: `CI ${env.GITHUB_SHA?.slice(0, 7) ?? 'local'} ${path.basename(htmlFile)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    shareUrl = link.shareUrl ?? null;
  }
  //</gen>

  //<gen>rendering_ci_06_audit
  // Email Audit checks every link and image in the same HTML, plus HTML validity and content checks.
  let audit: AuditSummary | null = null;
  if (env.RENDER_AUDIT !== 'false') {
    const created = await audits.createEmailAudit({
      createEmailAuditOptions: { subject, fromAddress: env.FROM_EMAIL || undefined, htmlBody: html },
    });
    audit = summarizeAudit(created.analysis);
  }
  //</gen>

  const decision = decide(rows, audit, { failOnIncomplete: env.RENDER_FAIL_ON_INCOMPLETE === 'true' });
  console.log(`\n${formatTable(rows)}\n\n${formatAudit(audit)}\n`);
  console.log(`${decision.exitCode === 0 ? 'PASS' : 'FAIL'}: ${decision.message}`);
  if (shareUrl) console.log(`Screenshots for review (no login needed): ${shareUrl}`);
  console.log(`Full results (MailSlurp login): ${reportUrl}`);

  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, formatMarkdown(rows, audit, decision, shareUrl, reportUrl));
  if (env.RENDER_REPORT_FILE) {
    fs.writeFileSync(env.RENDER_REPORT_FILE, JSON.stringify({ runId: run.runId, reportUrl, shareUrl, decision, targets: rows, audit }, null, 2));
  }
  return decision.exitCode;
}

//<gen>rendering_ci_02_wait
// Each wait call holds on the server for up to 60 seconds, so wait in rounds until the run finishes
// or the time limit passes. Clients that haven't captured by then are reported, not hidden.
async function waitForRender(previews: DevicePreviewsControllerApi, runId: string, timeoutMs: number): Promise<DevicePreviewRunDto> {
  const deadline = Date.now() + timeoutMs;
  let run = (await previews.getDevicePreviewRun({ runId }));
  while (Date.now() < deadline) {
    const waited = await previews.waitForDevicePreviewRun({
      runId,
      timeoutMillis: Math.min(60_000, Math.max(1_000, deadline - Date.now())),
      pollIntervalMillis: 5_000,
    });
    run = waited.run;
    console.log(`  ${run.status}: ${run.screenshotCount} of ${run.targetCount} screenshots`);
    if (!waited.timedOut) break;
  }
  return run;
}
//</gen>

// Save each target's primary screenshot. The access URLs are signed, so no API key is sent.
async function downloadScreenshots(results: DevicePreviewRunResultsDto, dir: string): Promise<Map<string, string>> {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(results, null, 2));
  const files = new Map<string, string>();
  for (const target of results.targets) {
    const shot = results.screenshots.find(s => s.screenshotId === target.primaryScreenshotId)
      ?? results.screenshots.find(s => s.targetId === target.id);
    if (!shot?.accessUrl) continue;
    const response = await fetch(shot.accessUrl, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) continue;
    // Client profiles are unique within a run and already include _dark for dark mode.
    const name = `${(target.clientProfile || target.id).replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()}.png`;
    fs.writeFileSync(path.join(dir, name), Buffer.from(await response.arrayBuffer()));
    files.set(target.id, name);
  }
  return files;
}

main().then(
  code => process.exit(code),
  async error => {
    // mailslurp-client throws the HTTP Response for API errors.
    if (error instanceof Response) {
      console.error(`MailSlurp API error ${error.status}: ${await error.text()}`);
    } else {
      console.error(error instanceof Error ? error.message : error);
    }
    process.exit(3);
  },
);
