// Runs one inbox placement test and fails the build when Gmail or Outlook seeds put the email in spam.
//
//   1. Create a placement test. MailSlurp returns seed addresses and a tracking token.
//   2. Send your email to every seed through your own SMTP server or ESP.
//   3. Wait (bounded) for the seeds to report where the email landed.
//   4. Print a per-provider table and exit 1 on spam, 2 on no result, 3 on a setup error.
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  ApiInboxPlacementTestControllerApi,
  Configuration,
  CreateInboxPlacementTestOptionsAddressFormatEnum,
  CreateInboxPlacementTestOptionsRequestedSegmentEnum,
} from 'mailslurp-client';
import type { InboxPlacementTestResultsDto, InboxPlacementTestRunDto } from 'mailslurp-client';
import {
  decide, formatMarkdown, formatSeedLines, formatTable, maskAddress, parseFamilies, toSeedResult,
} from './placement.ts';
import { openSmtp, required, sendToSeeds } from './send.ts';

const env = process.env;
const POLL_INTERVAL_MS = 15_000;
const TERMINAL_STATUSES = new Set(['COMPLETE', 'COMPLETED', 'TIMED_OUT', 'CANCELLED', 'FAILED']);

async function main(): Promise<number> {
  // Check every setting and the SMTP login before creating a test, so a typo doesn't use one up.
  const apiKey = required(env, 'MAILSLURP_API_KEY');
  const fromEmail = required(env, 'FROM_EMAIL');
  const from = env.FROM_NAME ? { name: env.FROM_NAME, address: fromEmail } : fromEmail;
  const subject = env.EMAIL_SUBJECT || 'Your weekly product update';
  const html = fs.readFileSync(env.EMAIL_HTML_FILE || new URL('../templates/sample-email.html', import.meta.url), 'utf8');
  const families = parseFamilies(env.PLACEMENT_GATE_PROVIDERS);
  const failOnMissing = env.PLACEMENT_FAIL_ON_MISSING === 'true';
  const timeoutSeconds = Number(env.PLACEMENT_TIMEOUT_SECONDS || 600);
  if (!(timeoutSeconds > 0)) throw new Error('PLACEMENT_TIMEOUT_SECONDS must be a positive number');
  const segment = (env.PLACEMENT_SEGMENT || 'ALL_INBOXES') as CreateInboxPlacementTestOptionsRequestedSegmentEnum;
  if (!Object.values(CreateInboxPlacementTestOptionsRequestedSegmentEnum).includes(segment)) {
    throw new Error(`PLACEMENT_SEGMENT must be one of ${Object.values(CreateInboxPlacementTestOptionsRequestedSegmentEnum).join(', ')}`);
  }
  const smtp = openSmtp(env);
  await smtp.verify();

  const placement = new ApiInboxPlacementTestControllerApi(new Configuration({ apiKey }));

  //<gen>inbox_placement_ci_01_create_test
  // POST /inbox-placement-tests reserves seed inboxes at Gmail, Outlook and other providers
  // and returns their addresses plus a tracking token. Each call uses one placement test.
  const run = await placement.createInboxPlacementTest({
    createInboxPlacementTestOptions: {
      requestedSegment: segment,
      senderDomain: fromEmail.split('@')[1],
      fromEmail,
      publicShareRequested: false,
      addressFormat: CreateInboxPlacementTestOptionsAddressFormatEnum.COMMA,
    },
  });
  const { trackingToken, seedAddresses } = run;
  if (!trackingToken || seedAddresses.length === 0) throw new Error(`Test ${run.id} returned no seeds or token`);
  //</gen>
  const reportUrl = `https://app.mailslurp.com/inbox-placement/${run.id}`;
  console.log(`Created inbox placement test ${run.id} with ${seedAddresses.length} seeds and token ${trackingToken}`);

  try {
    await sendToSeeds(smtp, { from, subject, html }, trackingToken, seedAddresses);
  } finally {
    smtp.close();
  }
  console.log(`Sent "${subject} ${trackingToken}" from ${fromEmail} to ${seedAddresses.length} seeds`);

  const startedWaiting = Date.now();
  const { finished, results } = await waitForResults(placement, run.id, timeoutSeconds * 1000);
  const waited = Math.round((Date.now() - startedWaiting) / 1000);
  console.log(finished ? `Seeds finished reporting after ${waited}s` : `Stopped waiting after ${waited}s; seeds without a result count as missing`);

  const targets = results.results?.targets ?? [];
  if (targets.length === 0) {
    console.error(`MailSlurp returned no per-seed results yet. See ${reportUrl}`);
    return 2;
  }
  const seeds = targets.map(toSeedResult);
  const decision = decide(seeds, { families, failOnMissing });

  console.log(`\n${formatTable(seeds, families)}\n\n${formatSeedLines(seeds)}\n`);
  console.log(`${decision.exitCode === 0 ? 'PASS' : 'FAIL'}: ${decision.message}`);
  console.log(`Full report (MailSlurp login): ${reportUrl}`);

  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, formatMarkdown(seeds, families, decision, reportUrl));
  if (env.PLACEMENT_REPORT_FILE) {
    const masked = seeds.map(seed => ({ ...seed, seedAddress: maskAddress(seed.seedAddress) }));
    fs.writeFileSync(env.PLACEMENT_REPORT_FILE, JSON.stringify({ testId: run.id, reportUrl, finished, decision, seeds: masked }, null, 2));
  }
  return decision.exitCode;
}

//<gen>inbox_placement_ci_03_wait_results
// Seeds usually report within a few minutes. Poll the run until it reaches a final status or
// the timeout passes, then read the per-seed results either way.
async function waitForResults(placement: ApiInboxPlacementTestControllerApi, testId: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let run: InboxPlacementTestRunDto;
  do {
    await sleep(Math.min(POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())));
    run = await placement.getInboxPlacementTest({ id: testId });
    console.log(`  ${run.status}: ${run.matchedTargets}/${run.totalTargets} seeds reported`);
  } while (!run.completedAt && !TERMINAL_STATUSES.has(run.status ?? '') && Date.now() < deadline);

  const results: InboxPlacementTestResultsDto = await placement.getInboxPlacementTestResults({ id: testId });
  return { finished: Boolean(run.completedAt) || TERMINAL_STATUSES.has(run.status ?? ''), results };
}
//</gen>

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
