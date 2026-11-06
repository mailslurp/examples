//<gen>render_docs_setup
import { MailSlurp } from 'mailslurp-client';

export function createClient() {
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  return new MailSlurp({ apiKey });
}
//</gen>

/** @param {MailSlurp} mailslurp */
//<gen>render_docs_list_targets
export async function listTargets(mailslurp) {
  // Each target is one email client on one device, for example ios_mail_physical_device.
  const availability = await mailslurp.devicePreviewsController.getDevicePreviewNativeTargetAvailability();
  return availability.targets
    .filter(target => target.enabled)
    .map(target => ({ target: target.target, client: target.client, platform: target.platform, status: target.status }));
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} html */
//<gen>render_docs_create_from_html
export async function renderHtml(mailslurp, html) {
  // Render HTML directly, without sending it to an inbox first.
  return mailslurp.devicePreviewsController.createDevicePreviewRunFromHtmlImport({
    createDevicePreviewHtmlImportOptions: {
      html,
      subject: 'Spring sale preview',
      options: { targets: ['gmail_chromium_web', 'ios_mail_physical_device'] },
    },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} emailId */
//<gen>render_docs_create_from_email
export async function renderEmail(mailslurp, emailId) {
  // Render an email already received by a MailSlurp inbox, for example from your ESP.
  return mailslurp.devicePreviewsController.createDevicePreviewRun({
    emailId,
    createDevicePreviewOptions: { allTargets: true },
  });
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} runId */
//<gen>render_docs_wait
export async function waitForRun(mailslurp, runId) {
  // Each call waits on the server for up to 60 seconds, so wait in rounds.
  for (let round = 0; round < 5; round += 1) {
    const result = await mailslurp.devicePreviewsController.waitForDevicePreviewRun({
      runId,
      timeoutMillis: 60_000,
      pollIntervalMillis: 5_000,
    });
    if (!result.timedOut) return result.run;
  }
  throw new Error(`Render ${runId} is still running after 5 minutes`);
}
//</gen>

/** @param {MailSlurp} mailslurp @param {string} runId */
//<gen>render_docs_screenshots
export async function screenshots(mailslurp, runId) {
  const results = await mailslurp.devicePreviewsController.getDevicePreviewRunResults({ runId });
  // accessUrl is an authenticated image URL for each captured screenshot.
  return results.screenshots.map(shot => ({ title: shot.title, url: shot.accessUrl }));
}
//</gen>
