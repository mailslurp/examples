import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import {
  ApiInboxPlacementTestControllerApi,
  Configuration,
  MailSlurp,
} from "mailslurp-client";

const shouldRunLiveExamples =
  process.env.RUN_MAILSLURP_INBOX_PLACEMENT_EXAMPLES === "true";

// These values are intentionally outside the generated snippets so landing-page
// copy can define real values once and keep each code block focused.
const YOUR_API_KEY = process.env.API_KEY;
const YOUR_DOMAIN = process.env.MAILSLURP_TEST_DOMAIN || "mailslurp.com";
const YOUR_FROM_EMAIL =
  process.env.MAILSLURP_TEST_FROM_EMAIL || `hello@${YOUR_DOMAIN}`;
const YOUR_SENDER_INBOX_ID = process.env.MAILSLURP_SENDER_INBOX_ID;
const YOUR_ALERT_EMAIL =
  process.env.MAILSLURP_DOMAIN_MONITOR_ALERT_EMAIL ||
  `postmaster@${YOUR_DOMAIN}`;
const YOUR_SHARE_TOKEN = process.env.MAILSLURP_INBOX_PLACEMENT_SHARE_TOKEN;

function createMailSlurpClients() {
  //<gen>inbox_placement_00_01_setup_client
  const mailslurp = new MailSlurp({ apiKey: YOUR_API_KEY });
  const inboxPlacementController = new ApiInboxPlacementTestControllerApi(
    new Configuration({ apiKey: YOUR_API_KEY }),
  );
  //</gen>

  return { inboxPlacementController, mailslurp };
}

test("MailSlurp JavaScript client exposes inbox placement and domain monitor APIs", (t) => {
  if (!YOUR_API_KEY) {
    t.skip("Set API_KEY to run the MailSlurp client API-surface test.");
    return;
  }

  const { inboxPlacementController, mailslurp } = createMailSlurpClients();

  assert.equal(
    typeof inboxPlacementController.createInboxPlacementTest,
    "function",
  );
  assert.equal(
    typeof inboxPlacementController.getInboxPlacementTestResults,
    "function",
  );
  assert.equal(typeof mailslurp.toolsController.checkDomainMonitor, "function");
  assert.equal(
    typeof mailslurp.domainMonitorController.createDomainMonitor,
    "function",
  );
});

test(
  "MailSlurp inbox placement examples",
  { timeout: 600_000 },
  async (t) => {
    if (!shouldRunLiveExamples) {
      t.skip(
        "Set RUN_MAILSLURP_INBOX_PLACEMENT_EXAMPLES=true to create live inbox placement runs.",
      );
      return;
    }

    if (!YOUR_API_KEY) {
      t.skip("Set API_KEY to run live examples.");
      return;
    }

    const { inboxPlacementController, mailslurp } = createMailSlurpClients();

    if (!YOUR_SENDER_INBOX_ID) {
      t.skip(
        "Set MAILSLURP_SENDER_INBOX_ID to send the placement test email.",
      );
      return;
    }

    //<gen>inbox_placement_01_01_create_test
    // Create an inbox placement run and ask MailSlurp for seed inboxes.
    const inboxPlacementRun =
      await inboxPlacementController.createInboxPlacementTest({
        createInboxPlacementTestOptions: {
          requestedSegment: "ALL_INBOXES",
          senderDomain: YOUR_DOMAIN,
          fromEmail: YOUR_FROM_EMAIL,
          publicShareRequested: true,
          addressFormat: "COMMA",
        },
      });

    console.log({
      id: inboxPlacementRun.id,
      totalTargets: inboxPlacementRun.totalTargets,
      seedAddresses: inboxPlacementRun.seedAddresses,
    });
    //</gen>

    assert.ok(inboxPlacementRun.id);
    assert.ok(inboxPlacementRun.seedAddresses.length > 0);

    //<gen>inbox_placement_01_02_send_campaign_to_seed_inboxes
    // Send the campaign email to every seed inbox from a verified sender inbox.
    await mailslurp.sendEmail(YOUR_SENDER_INBOX_ID, {
      to: inboxPlacementRun.seedAddresses,
      subject: `Inbox placement smoke test for ${YOUR_DOMAIN}`,
      body: `
        <!doctype html>
        <html>
          <body>
            <h1>Inbox placement test</h1>
            <p>This message measures inbox, spam, and missing placement.</p>
          </body>
        </html>
      `,
      isHTML: true,
    });
    //</gen>

    //<gen>inbox_placement_01_03_wait_for_results
    // Poll the run until MailSlurp has placement evidence from the seed inboxes.
    async function waitForInboxPlacementResults(testId) {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const run = await inboxPlacementController.getInboxPlacementTest({
          id: testId,
        });

        if (run.completedAt || run.matchedTargets > 0) {
          return inboxPlacementController.getInboxPlacementTestResults({
            id: testId,
          });
        }

        await sleep(15_000);
      }

      throw new Error(`Inbox placement test ${testId} did not finish in time`);
    }

    const inboxPlacementResults = await waitForInboxPlacementResults(
      inboxPlacementRun.id,
    );

    const deliverability = inboxPlacementResults.results?.deliverability;
    console.log({
      totalTargets: deliverability?.totalTargets,
      inboxTargets: deliverability?.inboxTargets,
      spamTargets: deliverability?.spamTargets,
      notReceivedTargets: deliverability?.notReceivedTargets,
      spamScores: inboxPlacementResults.spamScores,
    });
    //</gen>

    assert.equal(inboxPlacementResults.run.id, inboxPlacementRun.id);

    //<gen>inbox_placement_01_04_inspect_target_results
    // Inspect per-provider and per-inbox placement outcomes.
    const targetResults = inboxPlacementResults.results?.targets ?? [];

    const placementsByProvider = targetResults.reduce((acc, target) => {
      const provider = target.provider || "unknown";
      acc[provider] ??= { inbox: 0, spam: 0, missing: 0 };

      if (target.placementFolder === "INBOX") {
        acc[provider].inbox += 1;
      } else if (target.placementFolder === "SPAM") {
        acc[provider].spam += 1;
      } else {
        acc[provider].missing += 1;
      }

      return acc;
    }, {});

    console.log(placementsByProvider);
    //</gen>

    assert.ok(typeof placementsByProvider === "object");

    //<gen>inbox_placement_01_05_read_setup_and_content_analysis
    // Read setup and content analysis for authentication and deliverability issues.
    const analysis = await inboxPlacementController.getInboxPlacementTestAnalysis({
      id: inboxPlacementRun.id,
    });

    const actionItems = [
      ...analysis.setupItems,
      ...analysis.contentItems,
    ].filter((item) => item.status !== "PASS");

    console.log(
      actionItems.map((item) => ({
        status: item.status,
        title: item.title,
        message: item.message,
      })),
    );
    //</gen>

    assert.ok(Array.isArray(analysis.setupItems));

    //<gen>inbox_placement_01_06_fetch_analytics
    // Fetch aggregate inbox placement trends for your sender domain.
    const before = new Date();
    const since = new Date(before.getTime() - 30 * 24 * 60 * 60 * 1000);

    const breakdown =
      await inboxPlacementController.getInboxPlacementAnalyticsBreakdown({
        since,
        before,
        senderDomain: YOUR_DOMAIN,
        fromEmail: YOUR_FROM_EMAIL,
        limit: 10,
      });

    const series = await inboxPlacementController.getInboxPlacementAnalyticsSeries({
      since,
      before,
      bucket: "DAY",
      groupBy: "SENDER_DOMAIN",
      senderDomain: YOUR_DOMAIN,
      runLimit: 100,
      groupLimit: 5,
    });

    console.log({
      summary: breakdown.summary,
      folders: breakdown.folders,
      points: series.points,
    });
    //</gen>

    assert.ok(breakdown.summary);
    assert.ok(Array.isArray(series.points));

    //<gen>inbox_placement_01_07_read_public_share
    // If the run requested a public share, read share-safe results by token.
    const shareToken =
      YOUR_SHARE_TOKEN ||
      inboxPlacementResults.results?.share?.token ||
      inboxPlacementResults.results?.share?.shareToken;

    if (shareToken) {
      const publicShare =
        await inboxPlacementController.getInboxPlacementPublicShare({
          shareToken,
        });

      const publicAnalysis =
        await inboxPlacementController.getInboxPlacementPublicShareAnalysis({
          shareToken,
        });

      console.log({
        run: publicShare.run,
        spamScores: publicShare.spamScores,
        setupItems: publicAnalysis.setupItems.length,
        contentItems: publicAnalysis.contentItems.length,
      });
    }
    //</gen>

    //<gen>inbox_placement_01_08_list_recent_runs
    // List recent inbox placement runs for a dashboard or account overview.
    const recentRuns = await inboxPlacementController.getInboxPlacementTests({
      limit: 10,
    });

    console.log(
      recentRuns.map((run) => ({
        id: run.id,
        senderDomain: run.senderDomain,
        status: run.status,
        totalTargets: run.totalTargets,
        inboxTargets: run.inboxTargets,
        spamTargets: run.spamTargets,
      })),
    );
    //</gen>

    assert.ok(recentRuns.some((run) => run.id === inboxPlacementRun.id));
  },
);

test(
  "MailSlurp domain monitor examples",
  { timeout: 240_000 },
  async (t) => {
    if (!shouldRunLiveExamples) {
      t.skip(
        "Set RUN_MAILSLURP_INBOX_PLACEMENT_EXAMPLES=true to run live domain monitor examples.",
      );
      return;
    }

    if (!YOUR_API_KEY) {
      t.skip("Set API_KEY to run live examples.");
      return;
    }

    const { mailslurp } = createMailSlurpClients();

    let monitor;

    try {
      //<gen>domain_monitor_01_01_run_one_shot_domain_check
      // Run a one-shot domain monitor check without creating a saved monitor.
      const domainCheck = await mailslurp.toolsController.checkDomainMonitor({
        checkDomainMonitorOptions: {
          domain: YOUR_DOMAIN,
        },
      });

      console.log({
        domain: domainCheck.domain,
        status: domainCheck.status,
        healthScore: domainCheck.healthScore,
        spfOk: domainCheck.spfOk,
        dmarcOk: domainCheck.dmarcOk,
        dkimOk: domainCheck.dkimOk,
        mxOk: domainCheck.mxOk,
        insights: domainCheck.insights,
      });
      //</gen>

      assert.equal(domainCheck.domain, YOUR_DOMAIN);

      //<gen>domain_monitor_01_02_create_domain_monitor
      // Create a saved monitor for scheduled domain authentication checks.
      monitor = await mailslurp.domainMonitorController.createDomainMonitor({
        createDomainMonitorOptions: {
          domain: YOUR_DOMAIN,
          name: `Deliverability monitor for ${YOUR_DOMAIN}`,
          intervalSeconds: 24 * 60 * 60,
          schedulingEnabled: true,
        },
      });

      console.log({
        monitorId: monitor.id,
        domain: monitor.domain,
        schedulingEnabled: monitor.schedulingEnabled,
      });
      //</gen>

      assert.equal(monitor.domain, YOUR_DOMAIN);

      //<gen>domain_monitor_01_03_run_monitor_now
      // Trigger an immediate run and inspect the domain health result.
      const runNow = await mailslurp.domainMonitorController.runDomainMonitorNow({
        monitorId: monitor.id,
      });

      console.log({
        runId: runNow.run.id,
        status: runNow.run.status,
        healthScore: runNow.run.healthScore,
        passingChecks: runNow.run.passingChecks,
        failingChecks: runNow.run.failingChecks,
        insights: runNow.run.insights,
      });
      //</gen>

      assert.equal(runNow.run.monitorId, monitor.id);

      //<gen>domain_monitor_01_04_read_summary_history_and_auth_stack
      // Read the latest summary, auth stack, historical runs, and chart series.
      const summary = await mailslurp.domainMonitorController.getDomainMonitorSummary({
        monitorId: monitor.id,
        dkimSelector: "default",
      });

      const runs = await mailslurp.domainMonitorController.getDomainMonitorRuns({
        monitorId: monitor.id,
        limit: 10,
      });

      const series = await mailslurp.domainMonitorController.getDomainMonitorSeries({
        monitorId: monitor.id,
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        before: new Date(),
        bucket: "DAY",
      });

      console.log({
        latestRun: summary.latestRun,
        authStack: summary.authStack,
        runs,
        points: series.points,
      });
      //</gen>

      assert.equal(summary.monitor.id, monitor.id);
      assert.ok(Array.isArray(runs));
      assert.ok(Array.isArray(series.points));

      //<gen>domain_monitor_01_05_create_alert_and_verification_address
      // Add an alert sink and get the verification address for observed auth samples.
      const alertSink =
        await mailslurp.domainMonitorController.createDomainMonitorAlertSink({
          monitorId: monitor.id,
          createDomainMonitorAlertSinkOptions: {
            type: "EMAIL",
            target: YOUR_ALERT_EMAIL,
            severityThreshold: "MEDIUM",
            enabled: true,
          },
        });

      const verification =
        await mailslurp.domainMonitorController.createDomainMonitorEmailVerificationAddress({
          monitorId: monitor.id,
        });

      console.log({
        alertTarget: alertSink.target,
        verificationAddress: verification.emailAddress,
        verificationStatus: verification.status,
      });
      //</gen>

      assert.equal(alertSink.monitorId, monitor.id);
      assert.equal(verification.monitorId, monitor.id);
    } finally {
      if (monitor?.id) {
        await mailslurp.domainMonitorController.deleteDomainMonitor({
          monitorId: monitor.id,
        });
      }
    }
  },
);
