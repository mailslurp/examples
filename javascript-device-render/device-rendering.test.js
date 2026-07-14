import assert from "node:assert/strict";
import test from "node:test";
import { MailSlurp } from "mailslurp-client";

//<gen>device_render_00_01_setup_client
// Read the API key from the environment so examples can run locally and in CI.
const apiKey = process.env.MAILSLURP_API_KEY || process.env.API_KEY;

// Device render methods live on mailslurp.devicePreviewsController.
const mailslurp = new MailSlurp({ apiKey });
//</gen>

function downloadedByteLength(downloaded) {
  if (typeof downloaded === "string") {
    return Buffer.byteLength(downloaded);
  }

  if (downloaded instanceof Blob) {
    return downloaded.size;
  }

  if (downloaded?.byteLength !== undefined) {
    return downloaded.byteLength;
  }

  if (downloaded?.length !== undefined) {
    return downloaded.length;
  }

  return 0;
}

test(
  "MailSlurp device render examples",
  { timeout: 240_000 },
  async (t) => {
    if (!apiKey) {
      t.skip("Set API_KEY or MAILSLURP_API_KEY to run device render examples.");
      return;
    }

    //<gen>device_render_01_01_list_device_targets
    // List native device targets and their current availability before creating a run.
    const nativeTargetAvailability =
      await mailslurp.devicePreviewsController.getDevicePreviewNativeTargetAvailability();

    console.log(nativeTargetAvailability);
    // Rough shape:
    // {
    //   enabled: true,
    //   heartbeatOfflineAfterSeconds: 60,
    //   targets: [
    //     { target: "ios_mail_physical_device", status: "AVAILABLE", enabled: true, ... }
    //   ]
    // }
    //</gen>

    assert.ok(Array.isArray(nativeTargetAvailability.targets));

    //<gen>device_render_01_02_use_one_native_target
    // See https://www.mailslurp.com/docs/device-previews/ for the current device list.
    const nativeTarget = "ios_mail_physical_device";

    // Use one native target to keep this example focused and quick to run.
    const renderOptions = {
      nativeTargets: [nativeTarget],
    };
    //</gen>

    assert.ok(nativeTargetAvailability.targets.some((target) => target.target === nativeTarget));

    //<gen>device_render_02_01_create_run_from_existing_email
    // Create a temporary inbox and send it HTML so there is a stored email to render.
    const existingInbox = await mailslurp.createInboxWithOptions({
      expiresIn: 300_000,
      name: "device-render-existing-email",
    });

    await mailslurp.sendEmail(existingInbox.id, {
      to: [existingInbox.emailAddress],
      subject: "Device render from an existing email",
      body: `
        <!doctype html>
        <html>
          <body>
            <h1>Device render from an existing email</h1>
            <p>This email was sent to a MailSlurp inbox first.</p>
          </body>
        </html>
      `,
      isHTML: true,
    });

    const existingEmail = await mailslurp.waitForLatestEmail(existingInbox.id, 60_000);

    // Render the stored email by passing its emailId and native targets.
    const existingEmailRun = await mailslurp.devicePreviewsController.createDevicePreviewRun({
      emailId: existingEmail.id,
      createDevicePreviewOptions: {
        nativeTargets: ["ios_mail_physical_device"],
      },
    });
    //</gen>

    assert.ok(existingEmailRun.run.runId);
    assert.equal(existingEmailRun.run.emailId, existingEmail.id);

    //<gen>device_render_02_02_ensure_latest_run_for_existing_email
    // Ensure reuses an active render for the email when possible; otherwise it starts one.
    const ensuredExistingEmailRun = await mailslurp.devicePreviewsController.ensureDevicePreviewRun({
      emailId: existingEmail.id,
      createDevicePreviewOptions: {
        nativeTargets: ["ios_mail_physical_device"],
      },
    });
    //</gen>

    assert.ok(ensuredExistingEmailRun.run.runId);

    //<gen>device_render_02_03_create_run_from_imported_inbox_email
    // Import a raw RFC822 email into an inbox, then render the imported email.
    const importInbox = await mailslurp.createInboxWithOptions({
      expiresIn: 300_000,
      name: "device-render-inbox-import",
    });

    const importedRawMime = [
      "From: Example Sender <sender@example.test>",
      `To: ${importInbox.emailAddress}`,
      "Subject: Device render from an inbox import",
      `Message-ID: <device-render-inbox-import-${Date.now()}@example.test>`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      "<!doctype html><html><body><h1>Device render from an inbox import</h1></body></html>",
    ].join("\r\n");

    const importedEmail = await mailslurp.inboxController.importEmailIntoInbox({
      inboxId: importInbox.id,
      importEmailOptions: {
        rawEmailBase64: Buffer.from(importedRawMime, "utf8").toString("base64"),
        externalId: `inbox-import-${Date.now()}`,
        runPipeline: false,
        overrideMessageId: true,
      },
    });

    const inboxImportRun = await mailslurp.devicePreviewsController.createDevicePreviewRun({
      emailId: importedEmail.id,
      createDevicePreviewOptions: {
        nativeTargets: ["ios_mail_physical_device"],
      },
    });
    //</gen>

    assert.ok(inboxImportRun.run.runId);
    assert.equal(inboxImportRun.run.emailId, importedEmail.id);

    //<gen>device_render_02_04_create_run_from_raw_html
    // Send HTML directly to the device preview API without first storing an email.
    const htmlImportRun = await mailslurp.devicePreviewsController.createDevicePreviewRunFromHtmlImport({
      createDevicePreviewHtmlImportOptions: {
        html: `
          <!doctype html>
          <html>
            <body>
              <h1>Device render from raw HTML</h1>
              <p>This render was created directly from an HTML string.</p>
            </body>
          </html>
        `,
        subject: "Device render from raw HTML",
        from: "Example Sender <sender@example.test>",
        to: "recipient@example.test",
        sourceAlias: "raw-html-example",
        externalId: `html-import-${Date.now()}`,
        options: {
          nativeTargets: ["ios_mail_physical_device"],
        },
      },
    });
    //</gen>

    assert.ok(htmlImportRun.run.runId);

    //<gen>device_render_02_05_create_run_from_base64_raw_mime
    // Build a complete RFC822/MIME message and base64 encode it for import.
    const rawMimeForBase64Import = [
      "From: Example Sender <sender@example.test>",
      "To: recipient@example.test",
      "Subject: Device render from base64 raw MIME",
      `Message-ID: <device-render-base64-${Date.now()}@example.test>`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      "<!doctype html><html><body><h1>Device render from base64 raw MIME</h1></body></html>",
    ].join("\r\n");

    const rawMimeImportRun = await mailslurp.devicePreviewsController.createDevicePreviewRunFromImport({
      createDevicePreviewImportOptions: {
        rawEmailBase64: Buffer.from(rawMimeForBase64Import, "utf8").toString("base64"),
        sourceAlias: "raw-mime-base64-example",
        externalId: `raw-mime-import-${Date.now()}`,
        options: {
          nativeTargets: ["ios_mail_physical_device"],
        },
      },
    });
    //</gen>

    assert.ok(rawMimeImportRun.run.runId);

    //<gen>device_render_02_06_create_run_from_multipart_eml_upload
    // Upload an .eml file as multipart/form-data and create a render from it.
    const emlUploadMime = [
      "From: Example Sender <sender@example.test>",
      "To: recipient@example.test",
      "Subject: Device render from EML upload",
      `Message-ID: <device-render-eml-upload-${Date.now()}@example.test>`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      "<!doctype html><html><body><h1>Device render from an EML upload</h1></body></html>",
    ].join("\r\n");

    const emlUploadFile = new Blob([emlUploadMime], { type: "message/rfc822" });
    emlUploadFile.name = "device-render-example.eml";

    const emlUploadRun = await mailslurp.devicePreviewsController.createDevicePreviewRunFromMultipartImport({
      file: emlUploadFile,
      sourceAlias: "eml-upload-example",
      externalId: `eml-upload-${Date.now()}`,
      nativeTargets: ["ios_mail_physical_device"],
    });
    //</gen>

    assert.ok(emlUploadRun.run.runId);

    //<gen>device_render_02_07_create_run_from_raw_mime_bytes
    // Send RFC822 bytes directly as the request body for a raw MIME import.
    const rawMimeBytes = [
      "From: Example Sender <sender@example.test>",
      "To: recipient@example.test",
      "Subject: Device render from raw MIME bytes",
      `Message-ID: <device-render-raw-bytes-${Date.now()}@example.test>`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      "<!doctype html><html><body><h1>Device render from raw MIME bytes</h1></body></html>",
    ].join("\r\n");

    const rawMimeBytesFile = new Blob([rawMimeBytes], { type: "message/rfc822" });
    rawMimeBytesFile.name = "device-render-raw-bytes.eml";

    // The second argument is RequestInit; its body sends the raw MIME bytes.
    const rawMimeBytesRun = await mailslurp.devicePreviewsController.createDevicePreviewRunFromRawImport(
      {
        sourceAlias: "raw-mime-bytes-example",
        externalId: `raw-mime-bytes-${Date.now()}`,
        nativeTargets: ["ios_mail_physical_device"],
      },
      {
        body: rawMimeBytesFile,
      },
    );
    //</gen>

    assert.ok(rawMimeBytesRun.run.runId);

    //<gen>device_render_02_08_create_render_email_address
    // Create a temporary render email address. Email sent here starts a render run.
    const renderEmailAddress = await mailslurp.devicePreviewsController.createDevicePreviewImportAddress({
      createDevicePreviewIngestAddressOptions: {
        options: {
          nativeTargets: ["ios_mail_physical_device"],
        },
      },
    });
    //</gen>

    assert.ok(renderEmailAddress.emailAddress);

    //<gen>device_render_02_09_send_email_to_render_address
    // Send HTML from a MailSlurp HTTP inbox to the render address.
    const mailSenderInbox = await mailslurp.createInboxWithOptions({
      expiresIn: 300_000,
      name: "device-render-mail-sender",
      inboxType: "HTTP_INBOX",
    });

    await mailslurp.sendEmail(mailSenderInbox.id, {
      to: [renderEmailAddress.emailAddress],
      subject: "Device render through a render email address",
      body: `
        <!doctype html>
        <html>
          <body>
            <h1>Device render through a render email address</h1>
            <p>MailSlurp creates the render run when this email arrives.</p>
          </body>
        </html>
      `,
      isHTML: true,
    });
    //</gen>

    const runId = htmlImportRun.run.runId;

    //<gen>device_render_03_01_wait_for_run
    // Poll until the run completes or the timeout elapses.
    const completed = await mailslurp.devicePreviewsController.waitForDevicePreviewRun({
      runId,
      timeoutMillis: 60_000,
      pollIntervalMillis: 2_000,
    });

    assert.equal(completed.timedOut, false);
    assert.match(completed.run.status, /COMPLETE|PARTIAL_COMPLETE/);
    //</gen>

    //<gen>device_render_03_02_get_run_and_list_runs
    // Fetch one run directly, then list runs by email and account.
    const run = await mailslurp.devicePreviewsController.getDevicePreviewRun({
      runId,
    });

    const emailRuns = await mailslurp.devicePreviewsController.getDevicePreviewRuns({
      emailId: existingEmail.id,
      limit: 10,
      hydrateThumbnail: true,
    });

    const accountRuns = await mailslurp.devicePreviewsController.getDevicePreviewRunsForAccount({
      limit: 10,
      hydrateThumbnail: true,
    });

    const paginatedAccountRuns =
      await mailslurp.devicePreviewsController.getDevicePreviewRunsForAccountOffsetPaginated({
        page: 0,
        size: 10,
        sort: "DESC",
        hydrateThumbnail: true,
      });
    //</gen>

    assert.equal(run.runId, runId);
    assert.ok(Array.isArray(emailRuns));
    assert.ok(accountRuns.some((item) => item.runId === runId));
    assert.ok(Array.isArray(paginatedAccountRuns.content));

    //<gen>device_render_03_03_get_results_and_image_urls
    // Results include targets plus screenshot records with private image URLs.
    const results = await mailslurp.devicePreviewsController.getDevicePreviewRunResults({
      runId,
    });

    const imageUrls = results.screenshots
      .flatMap((screenshot) => [
        screenshot.accessUrl,
        screenshot.liveViewUrl,
        screenshot.deepLinkUrl,
      ])
      .filter(Boolean);

    console.log(imageUrls);
    //</gen>

    assert.equal(results.run.runId, runId);
    assert.ok(results.targets.length >= 1);
    assert.ok(results.screenshots.length >= 1);
    assert.ok(imageUrls.length >= 1);

    const primaryScreenshot = results.screenshots.find((screenshot) => screenshot.isPrimary);
    assert.ok(primaryScreenshot);

    //<gen>device_render_03_04_download_private_screenshot_image
    // Download a private screenshot image through the authenticated API.
    const screenshotImage = await mailslurp.devicePreviewsController.getDevicePreviewRunScreenshot({
      runId,
      screenshotId: primaryScreenshot.screenshotId,
    });
    //</gen>

    assert.ok(downloadedByteLength(screenshotImage) > 0);

    //<gen>device_render_03_05_create_share_link_and_public_image_urls
    // Create a share link, then read public image URLs from the shared result.
    const shareLink = await mailslurp.devicePreviewsController.createDevicePreviewShareLink({
      runId,
      createDevicePreviewShareLinkOptions: {
        label: "Device render example share link",
      },
    });

    const shareLinks = await mailslurp.devicePreviewsController.getDevicePreviewShareLinks({
      runId,
    });

    const sharedResult = await mailslurp.devicePreviewsController.getDevicePreviewSharedResult({
      shareToken: shareLink.token,
    });

    const publicImageUrls = sharedResult.screenshots
      .map((screenshot) => screenshot.imageUrl)
      .filter(Boolean);

    const publicScreenshotImage =
      await mailslurp.devicePreviewsController.getDevicePreviewSharedResultScreenshot({
        shareToken: shareLink.token,
        screenshotId: sharedResult.screenshots[0].screenshotId,
      });
    //</gen>

    assert.ok(shareLink.shareUrl);
    assert.ok(shareLinks.some((item) => item.id === shareLink.id));
    assert.equal(sharedResult.run.runId, runId);
    assert.ok(publicImageUrls.length >= 1);
    assert.ok(downloadedByteLength(publicScreenshotImage) > 0);

    await mailslurp.devicePreviewsController.deleteDevicePreviewShareLink({
      shareLinkId: shareLink.id,
    });
  },
);
