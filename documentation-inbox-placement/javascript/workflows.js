//<gen>placement_docs_setup
import {
  ApiInboxPlacementTestControllerApi,
  Configuration,
  CreateInboxPlacementTestOptionsAddressFormatEnum,
  CreateInboxPlacementTestOptionsRequestedSegmentEnum,
  MailSlurp,
} from 'mailslurp-client';

export function createClients() {
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  return {
    mailslurp: new MailSlurp({ apiKey }),
    placement: new ApiInboxPlacementTestControllerApi(new Configuration({ apiKey })),
  };
}
//</gen>

/** @param {ApiInboxPlacementTestControllerApi} placement @param {string} senderDomain @param {string} fromEmail */
//<gen>placement_docs_create_test
export async function createTest(placement, senderDomain, fromEmail) {
  // A test gives you seed addresses at Gmail, Outlook, Yahoo and other providers.
  const run = await placement.createInboxPlacementTest({
    createInboxPlacementTestOptions: {
      requestedSegment: CreateInboxPlacementTestOptionsRequestedSegmentEnum.ALL_INBOXES,
      senderDomain,
      fromEmail,
      publicShareRequested: false,
      addressFormat: CreateInboxPlacementTestOptionsAddressFormatEnum.COMMA,
    },
  });
  return { testId: run.id, seedAddresses: run.seedAddresses };
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} senderInboxId @param {string[]} seedAddresses */
//<gen>placement_docs_send_to_seeds
export async function sendToSeeds(mailslurp, senderInboxId, seedAddresses) {
  // Send your real campaign to the seed addresses. In production, send through your own ESP
  // from the domain you are testing; a MailSlurp inbox is used here to keep the example short.
  await mailslurp.sendEmail(senderInboxId, {
    to: seedAddresses,
    subject: 'Spring sale: 20% off everything',
    body: '<h1>Spring sale</h1><p>20% off everything this week.</p>',
    isHTML: true,
  });
}
//</gen>

/** @param {ApiInboxPlacementTestControllerApi} placement @param {string} testId */
//<gen>placement_docs_wait_results
export async function waitForResults(placement, testId) {
  // Seeds report as messages arrive; poll until the test completes (usually a few minutes).
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const run = await placement.getInboxPlacementTest({ id: testId });
    if (run.completedAt) {
      return { inbox: run.inboxTargets, spam: run.spamTargets, missing: run.notReceivedTargets, total: run.totalTargets };
    }
    await new Promise(resolve => setTimeout(resolve, 15_000));
  }
  throw new Error(`Inbox placement test ${testId} is still running`);
}
//</gen>

/** @param {ApiInboxPlacementTestControllerApi} placement @param {string} testId */
//<gen>placement_docs_by_provider
export async function placementByProvider(placement, testId) {
  // Count where each provider put the email: INBOX, SPAM or not received.
  const { results } = await placement.getInboxPlacementTestResults({ id: testId });
  const byProvider = {};
  for (const target of results?.targets ?? []) {
    const folder = target.placementFolder ?? 'NOT_RECEIVED';
    byProvider[target.provider] ??= {};
    byProvider[target.provider][folder] = (byProvider[target.provider][folder] ?? 0) + 1;
  }
  return byProvider;
}
//</gen>
