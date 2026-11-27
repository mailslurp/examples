// Pure helpers: summarize each render target, decide the build result and format the report.
// Nothing here calls the network, so test/report.test.ts checks it with recorded result shapes.
import type { DevicePreviewTargetDto, EmailAuditAnalysisResult } from 'mailslurp-client';

export interface TargetRow {
  targetId: string;
  client: string;
  platform: string;
  appearance: string;
  status: string;
  failureCode: string | null;
  screenshotFile: string | null;
}

export interface AuditSummary {
  status: string;
  healthScore: number;
  brokenLinks: string[];
  brokenImages: string[];
  insights: string[];
}

export interface GateOptions {
  failOnIncomplete: boolean;
}

export interface GateDecision {
  exitCode: 0 | 1 | 2;
  message: string;
}

// Client profiles name the app and the device, with a _dark suffix for dark mode.
const CLIENTS: Record<string, [string, string]> = {
  apple_mail_macos: ['Apple Mail', 'macOS'],
  ios_mail_physical_device: ['Apple Mail', 'iPhone'],
  ipados_mail_physical_device: ['Apple Mail', 'iPad'],
  gmail_chromium_web: ['Gmail', 'web'],
  gmail_android_emulator: ['Gmail', 'Android'],
  gmail_ios_physical_device: ['Gmail', 'iPhone'],
  outlook_classic_windows: ['Outlook (classic)', 'Windows'],
  outlook_new_windows: ['Outlook (new)', 'Windows'],
  outlook_chromium_web: ['Outlook', 'web'],
  outlook_android_emulator: ['Outlook', 'Android'],
  outlook_ios_physical_device: ['Outlook', 'iPhone'],
  yahoo_chromium_web: ['Yahoo Mail', 'web'],
};

//<gen>rendering_ci_04_summarize_targets
// Each target is one email client on one device, in light or dark mode, for example
// ios_mail_physical_device_dark. A target is READY when its screenshot was captured; FAILED,
// TIMED_OUT and the other statuses mean there is nothing to review.
export function toTargetRow(target: DevicePreviewTargetDto, screenshotFile: string | null): TargetRow {
  const profile = target.clientProfile ?? '';
  const dark = /_dark$/.test(profile) || Boolean(target.colorScheme?.toLowerCase().includes('dark'));
  const base = profile.replace(/_dark$/, '');
  const [client, platform] = CLIENTS[base] ?? [readable(base || target.provider || 'unknown client'), readable(target.platform ?? '')];
  return {
    targetId: target.id,
    client,
    platform,
    appearance: dark ? 'dark' : 'light',
    status: target.status ?? 'UNKNOWN',
    failureCode: target.failureCode ?? null,
    screenshotFile,
  };
}
//</gen>

export function readable(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function summarizeAudit(analysis: EmailAuditAnalysisResult): AuditSummary {
  return {
    status: analysis.status,
    healthScore: analysis.healthScore,
    brokenLinks: analysis.brokenLinks.map(issue => `${issue.url} (${issue.statusCode ?? issue.message})`),
    brokenImages: analysis.brokenImages.map(issue => `${issue.url} (${issue.statusCode ?? issue.message})`),
    insights: analysis.insights ?? [],
  };
}

//<gen>rendering_ci_05_gate
// Exit 1 when Email Audit finds a broken link or image: a reviewer can't see that in a screenshot.
// Exit 2 when no client rendered, or when any client didn't render and RENDER_FAIL_ON_INCOMPLETE=true.
// Otherwise exit 0 and leave the visual review to a person, with the screenshots and share link.
export function decide(rows: TargetRow[], audit: AuditSummary | null, options: GateOptions): GateDecision {
  const ready = rows.filter(row => row.status === 'READY');
  const notReady = rows.length - ready.length;
  if (audit && (audit.brokenLinks.length > 0 || audit.brokenImages.length > 0)) {
    const parts = [];
    if (audit.brokenLinks.length > 0) parts.push(`${audit.brokenLinks.length} broken link${audit.brokenLinks.length === 1 ? '' : 's'}`);
    if (audit.brokenImages.length > 0) parts.push(`${audit.brokenImages.length} broken image${audit.brokenImages.length === 1 ? '' : 's'}`);
    return { exitCode: 1, message: `Email Audit found ${parts.join(' and ')}.` };
  }
  if (ready.length === 0) {
    return { exitCode: 2, message: `None of the ${rows.length} clients rendered, so there is nothing to review.` };
  }
  if (notReady > 0 && options.failOnIncomplete) {
    return { exitCode: 2, message: `${notReady} of ${rows.length} clients didn't render, and RENDER_FAIL_ON_INCOMPLETE is on.` };
  }
  const incompleteNote = notReady > 0 ? ` ${notReady} didn't render; see the status column.` : '';
  return { exitCode: 0, message: `${ready.length} of ${rows.length} clients rendered and the audit found no broken links or images.${incompleteNote}` };
}
//</gen>

export function sortRows(rows: TargetRow[]): TargetRow[] {
  return [...rows].sort((a, b) => a.client.localeCompare(b.client) || a.platform.localeCompare(b.platform) || a.appearance.localeCompare(b.appearance));
}

export function formatTable(rows: TargetRow[]): string {
  const header = ['Client', 'Platform', 'Mode', 'Status', 'Screenshot'];
  const body = sortRows(rows).map(row => [
    row.client, row.platform, row.appearance,
    row.failureCode ? `${row.status} (${row.failureCode})` : row.status,
    row.screenshotFile ?? '-',
  ]);
  const widths = header.map((cell, index) => Math.max(cell.length, ...body.map(line => line[index].length)));
  const line = (cells: string[]) => cells.map((cell, index) => cell.padEnd(widths[index])).join('  ').trimEnd();
  return [line(header), line(widths.map(width => '-'.repeat(width))), ...body.map(line)].join('\n');
}

export function formatAudit(audit: AuditSummary | null): string {
  if (!audit) return 'Email Audit: skipped (RENDER_AUDIT=false).';
  const lines = [`Email Audit: ${audit.status}, health score ${audit.healthScore}`];
  for (const link of audit.brokenLinks) lines.push(`  broken link: ${link}`);
  for (const image of audit.brokenImages) lines.push(`  broken image: ${image}`);
  // The audit's own notes explain its status, such as client support for the CSS and HTML used.
  for (const insight of audit.insights) lines.push(`  ${insight}`);
  return lines.join('\n');
}

export function formatMarkdown(rows: TargetRow[], audit: AuditSummary | null, decision: GateDecision, shareUrl: string | null, reportUrl: string): string {
  const table = sortRows(rows).map(row =>
    `| ${row.client} | ${row.platform} | ${row.appearance} | ${row.failureCode ? `${row.status} (${row.failureCode})` : row.status} |`);
  return [
    '### Email rendering',
    '',
    `${decision.exitCode === 0 ? 'Passed' : 'Failed'}: ${decision.message}`,
    '',
    shareUrl ? `Screenshots for review (no login needed): ${shareUrl}` : `Screenshots: ${reportUrl} (MailSlurp login)`,
    '',
    '| Client | Platform | Mode | Status |',
    '| --- | --- | --- | --- |',
    ...table,
    '',
    audit ? `Email Audit: ${audit.status}, health score ${audit.healthScore}. Broken links: ${audit.brokenLinks.length}. Broken images: ${audit.brokenImages.length}.` : 'Email Audit: skipped.',
    '',
  ].join('\n');
}
