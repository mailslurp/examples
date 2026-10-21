import { CreateWebhookOptionsEventNameEnum } from 'mailslurp-client';

// Each marked body is used by the webapp goal selector. The caller supplies its MailSlurp client.
export async function emailOtp(mailslurp) {
  //<gen>onboarding_goal_email_otp
  // Send a synthetic OTP to an owned inbox; no external application is required.
  const inbox = await mailslurp.createInboxWithOptions({ expiresIn: 300_000 });
  try {
    await mailslurp.sendEmail(inbox.id, {
      to: [inbox.emailAddress],
      subject: 'Your verification code',
      body: 'Your code is 482731',
    });
    const email = await mailslurp.waitForLatestEmail(inbox.id, 30_000, true);
    const otp = /Your code is (\d{6})/.exec(email.body ?? '')?.[1];
    if (otp !== '482731') throw new Error('The received OTP did not match');
    console.log('Email OTP matched');
  } finally {
    await mailslurp.deleteInbox(inbox.id);
  }
  //</gen>
}

export async function sendEmail(mailslurp) {
  //<gen>onboarding_goal_send_email
  // Use the returned address as the recipient, including on sandbox accounts.
  const inbox = await mailslurp.createInboxWithOptions({ expiresIn: 300_000 });
  try {
    await mailslurp.sendEmail(inbox.id, {
      to: [inbox.emailAddress], subject: 'Hello', body: 'Welcome',
    });
    const email = await mailslurp.waitForLatestEmail(inbox.id, 30_000, true);
    if (email.subject !== 'Hello' || !email.body?.includes('Welcome')) {
      throw new Error('The received message did not match');
    }
    console.log('Sent and received the test email');
  } finally {
    await mailslurp.deleteInbox(inbox.id);
  }
  //</gen>
}

export async function testPhone(mailslurp) {
  //<gen>onboarding_goal_phone
  // Replace this ID with a number already owned by your account.
  // Number rental and SMS usage require the corresponding plan and may incur charges.
  const phoneNumberId = 'YOUR_EXISTING_PHONE_NUMBER_ID';
  const phone = await mailslurp.phoneController.getPhoneNumber({ phoneNumberId });
  console.log('Send a test SMS to', phone.phoneNumber);
  const sms = await mailslurp.waitController.waitForLatestSms({
    waitForSingleSmsOptions: { phoneNumberId, timeout: 30_000, unreadOnly: true },
  });
  if (!sms.body) throw new Error('The received SMS had no body');
  console.log('Received a test SMS');
  //</gen>
}

export async function createWebhook(mailslurp) {
  //<gen>onboarding_goal_webhook
  // Replace both placeholders with an owned inbox and your public HTTPS receiver.
  const inboxId = 'YOUR_EXISTING_INBOX_ID';
  const webhook = await mailslurp.webhookController.createWebhook({
    inboxId,
    createWebhookOptions: {
      url: 'https://your-app.example/webhooks/mailslurp',
      eventName: CreateWebhookOptionsEventNameEnum.NEW_EMAIL,
    },
  });
  console.log('Webhook registered', webhook.id);
  // Send an email to the inbox and check your receiver for the NEW_EMAIL request.
  // When finished: await mailslurp.webhookController.deleteWebhook({ inboxId, webhookId: webhook.id });
  //</gen>
}

export async function renderEmail(mailslurp) {
  //<gen>onboarding_goal_device_rendering
  // Use an email already stored in your account. Rendering requires device-preview access.
  const emailId = 'YOUR_EXISTING_EMAIL_ID';
  const preview = await mailslurp.devicePreviewsController.createDevicePreviewRun({
    emailId, createDevicePreviewOptions: {},
  });
  const runId = preview.run.runId;
  const waited = await mailslurp.devicePreviewsController.waitForDevicePreviewRun({
    runId, timeoutMillis: 30_000, pollIntervalMillis: 1_000,
  });
  console.log("Render run", runId, waited.run.status);
  if (waited.timedOut) throw new Error(`Render ${runId} is still running; poll this run ID again`);
  if (waited.run.status === 'FAILED') throw new Error(`Render ${runId} failed`);
  const results = await mailslurp.devicePreviewsController.getDevicePreviewRunResults({ runId });
  if (!results.screenshots.length) throw new Error(`Render ${runId} returned no screenshots`);
  console.log(results);
  //</gen>
}
