// Pure helpers: classify each seed result, decide whether the build passes and format the report.
// Nothing here calls the network, so test/placement.test.ts can check it with recorded results.
import type { InboxPlacementTargetResultDto } from 'mailslurp-client';

export type Outcome = 'inbox' | 'tab' | 'spam' | 'missing' | 'other';
export type Family = 'gmail' | 'outlook' | 'yahoo' | 'apple' | 'other';

export interface SeedResult {
  provider: string;
  family: Family;
  seedAddress: string;
  outcome: Outcome;
  verdict: string | null;
  folder: string | null;
  latencyMs: number | null;
  stillWaiting: boolean;
}

//<gen>inbox_placement_ci_04_classify
// Seed providers are named like "Gmail Consumer", "Gmail Workspace", "Outlook Personal"
// and "Microsoft 365". Group them into the mailbox families a build gate cares about.
export function providerFamily(provider: string): Family {
  const name = provider.toLowerCase();
  if (name.includes('gmail') || name.includes('google')) return 'gmail';
  if (['outlook', 'microsoft', 'hotmail', 'office'].some(word => name.includes(word))) return 'outlook';
  if (name.includes('yahoo') || name.includes('aol')) return 'yahoo';
  if (name.includes('icloud') || name.includes('apple')) return 'apple';
  return 'other';
}

// placementVerdict is the seed's reading of where the email landed. "missing" covers both a
// seed that never received the email and one that had not reported when the wait ended.
// Neither is counted as inbox.
export function classifyTarget(target: InboxPlacementTargetResultDto): Outcome {
  const verdict = target.placementVerdict?.toUpperCase();
  if (verdict === 'SPAM') return 'spam';
  if (verdict === 'NOT_RECEIVED') return 'missing';
  if (verdict === 'INBOX' || verdict === 'PRIMARY' || verdict === 'FOCUSED') return 'inbox';
  if (verdict === 'PROMOTIONS' || verdict === 'SOCIAL' || verdict === 'UPDATES' || verdict === 'FORUMS') return 'tab';
  if (verdict === 'OTHER') return 'other';
  // No verdict yet: use the folder if the seed reported one.
  const folder = target.placementFolder?.toLowerCase() ?? '';
  if (/spam|junk|bulk/.test(folder)) return 'spam';
  if (/inbox|primary|focused/.test(folder)) return 'inbox';
  return target.receivedAt ? 'other' : 'missing';
}
//</gen>

const FINAL_TARGET_STATUSES = new Set(['RESULT_READY', 'TIMED_OUT', 'SKIPPED', 'FAILED']);

export function toSeedResult(target: InboxPlacementTargetResultDto): SeedResult {
  const outcome = classifyTarget(target);
  return {
    provider: target.provider || 'Unknown',
    family: providerFamily(target.provider || ''),
    seedAddress: target.seedAddress,
    outcome,
    verdict: target.placementVerdict ?? null,
    folder: target.placementFolder ?? null,
    latencyMs: target.latencyMs ?? null,
    stillWaiting: outcome === 'missing' && !FINAL_TARGET_STATUSES.has(target.status),
  };
}

export interface GateOptions {
  families: Family[];
  failOnMissing: boolean;
}

export interface GateDecision {
  exitCode: 0 | 1 | 2;
  message: string;
}

//<gen>inbox_placement_ci_05_gate
// Exit 1 when any gated seed (Gmail and Outlook by default) put the email in spam or junk.
// Exit 2 when the test has no evidence for those providers: no gated seeds, every gated seed
// missing, or any missing seed when PLACEMENT_FAIL_ON_MISSING=true. Otherwise exit 0.
export function decide(results: SeedResult[], options: GateOptions): GateDecision {
  const gated = results.filter(result => options.families.includes(result.family));
  const names = options.families.map(label).join(' or ');
  const spam = gated.filter(result => result.outcome === 'spam');
  const missing = gated.filter(result => result.outcome === 'missing');

  if (gated.length === 0) {
    return { exitCode: 2, message: `No ${names} seeds were in this test, so there is nothing to gate on.` };
  }
  if (spam.length > 0) {
    return { exitCode: 1, message: `${spam.length} of ${gated.length} ${names} seeds put the email in spam or junk.` };
  }
  if (missing.length === gated.length) {
    return { exitCode: 2, message: `None of the ${gated.length} ${names} seeds received the email. Check the send and that the tracking token is in the subject.` };
  }
  if (missing.length > 0 && options.failOnMissing) {
    return { exitCode: 2, message: `${missing.length} of ${gated.length} ${names} seeds have no result, and PLACEMENT_FAIL_ON_MISSING is on.` };
  }
  const missingNote = missing.length > 0 ? ` ${missing.length} had no result and were not counted as inbox.` : '';
  return { exitCode: 0, message: `No ${names} seed put the email in spam.${missingNote}` };
}
//</gen>

export function label(family: Family): string {
  return { gmail: 'Gmail', outlook: 'Outlook', yahoo: 'Yahoo', apple: 'Apple', other: 'Other' }[family];
}

export function parseFamilies(value: string | undefined): Family[] {
  const allowed: Family[] = ['gmail', 'outlook', 'yahoo', 'apple', 'other'];
  const requested = (value || 'gmail,outlook').split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
  const unknown = requested.filter(item => !allowed.includes(item as Family));
  if (unknown.length > 0) throw new Error(`PLACEMENT_GATE_PROVIDERS has unknown values: ${unknown.join(', ')}. Use ${allowed.join(', ')}.`);
  return requested as Family[];
}

// Show "da***@gm***.com" instead of the full seed address in CI logs, which may be public.
export function maskAddress(address: string): string {
  const [local, domain] = address.split('@');
  if (!domain) return '***';
  const dot = domain.lastIndexOf('.');
  const name = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : '';
  return `${local.slice(0, 2)}***@${name.slice(0, 2)}***${tld}`;
}

const COLUMNS: Outcome[] = ['inbox', 'tab', 'spam', 'missing', 'other'];

export function providerRows(results: SeedResult[], families: Family[]) {
  const rows = new Map<string, Record<Outcome, number> & { provider: string; seeds: number; gated: boolean }>();
  for (const result of results) {
    const row = rows.get(result.provider) ?? {
      provider: result.provider, seeds: 0, gated: families.includes(result.family),
      inbox: 0, tab: 0, spam: 0, missing: 0, other: 0,
    };
    row.seeds += 1;
    row[result.outcome] += 1;
    rows.set(result.provider, row);
  }
  return [...rows.values()].sort((a, b) => Number(b.gated) - Number(a.gated) || a.provider.localeCompare(b.provider));
}

export function formatTable(results: SeedResult[], families: Family[]): string {
  const header = ['Provider', 'Seeds', 'Inbox', 'Tab', 'Spam', 'Missing', 'Other', 'Gated'];
  const body = providerRows(results, families).map(row => [
    row.provider, String(row.seeds), ...COLUMNS.map(column => String(row[column])), row.gated ? 'yes' : 'no',
  ]);
  const widths = header.map((cell, index) => Math.max(cell.length, ...body.map(line => line[index].length)));
  const line = (cells: string[]) => cells.map((cell, index) => cell.padEnd(widths[index])).join('  ').trimEnd();
  return [line(header), line(widths.map(width => '-'.repeat(width))), ...body.map(line)].join('\n');
}

export function formatSeedLines(results: SeedResult[]): string {
  return [...results]
    .sort((a, b) => a.provider.localeCompare(b.provider))
    .map(result => {
      // Show the seed's verdict and folder, for example "tab (UPDATES, INBOX)".
      const details = [...new Set([result.verdict, result.folder].filter(Boolean))].join(', ');
      const where = result.outcome === 'missing'
        ? (result.stillWaiting ? 'missing (no result yet)' : 'missing (not received)')
        : `${result.outcome}${details ? ` (${details})` : ''}`;
      const latency = result.latencyMs != null ? `, ${(result.latencyMs / 1000).toFixed(1)}s` : '';
      return `  ${result.provider.padEnd(18)} ${maskAddress(result.seedAddress).padEnd(22)} ${where}${latency}`;
    })
    .join('\n');
}

export function formatMarkdown(results: SeedResult[], families: Family[], decision: GateDecision, reportUrl: string): string {
  const rows = providerRows(results, families).map(row =>
    `| ${row.provider} | ${row.seeds} | ${COLUMNS.map(column => row[column]).join(' | ')} | ${row.gated ? 'yes' : 'no'} |`);
  return [
    '### Inbox placement',
    '',
    `${decision.exitCode === 0 ? 'Passed' : 'Failed'}: ${decision.message}`,
    '',
    '| Provider | Seeds | Inbox | Tab | Spam | Missing | Other | Gated |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
    `Full report: ${reportUrl}`,
    '',
  ].join('\n');
}
