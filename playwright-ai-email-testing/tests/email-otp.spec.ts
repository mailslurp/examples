// Adapted from ../playwright-email-testing/tests/example.spec.ts.
//<gen>playwright_ai_imports
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import type { Inbox, Evaluation } from './response-types.js';
//</gen>

test('sign up, extract an email OTP with AI, verify and sign in', async ({ page, request }, testInfo) => {
  //<gen>playwright_ai_create_inbox
  const apiKey = process.env.MAILSLURP_API_KEY;
  if (!apiKey) throw new Error('Set MAILSLURP_API_KEY');
  const baseUrl = (process.env.MAILSLURP_BASE_PATH ?? 'https://api.mailslurp.com').replace(/\/$/, '');
  const headers = { 'x-api-key': apiKey };
  const appUrl = process.env.APP_URL ?? 'https://playground.mailslurp.com';
  const password = 'Test-password-42!';
  const inboxResponse = await request.post(`${baseUrl}/inboxes`, {
    headers, params: { expiresIn: 600_000 },
  });
  await expect(inboxResponse).toBeOK();
  const inbox: Inbox = await inboxResponse.json();
  //</gen>
  try {
    //<gen>playwright_ai_signup
    await page.goto(appUrl);
    await page.locator('[data-test="sign-in-create-account-link"]').click();
    await page.locator('input[name=email]').fill(inbox.emailAddress);
    await page.locator('input[name=password]').fill(password);
    const since = new Date().toISOString();
    await page.locator('[data-test="sign-up-create-account-button"]').click();
    //</gen>
    //<gen>playwright_ai_wait_extract
    const aiResponse = await request.post(`${baseUrl}/ai/messages/wait`, {
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      timeout: 130_000,
      data: {
        scope: { inboxIds: [inbox.id] }, since, timeout: 120_000,
        match: { prompt: 'The account signup verification email containing a confirmation code' },
        extractionPreset: 'OTP_CODE',
      },
    });
    await expect(aiResponse).toBeOK();
    const result: Evaluation = await aiResponse.json();
    // Fail once on ambiguity or provider failure; do not retry until the model says PASS.
    expect(result.successful, `${result.summary} (evaluation ${result.evaluationId})`).toBe(true);
    expect(result.data?.code).toMatch(/^\d{6}$/);
    //</gen>
    //<gen>playwright_ai_diagnostics
    expect(result.usage.complete).toBe(true);
    expect(result.usage.reservedTokens).toBe(0);
    expect(result.extractionEvidence['/code']?.length).toBeGreaterThan(0);
    await testInfo.attach('ai-evaluation', { body: JSON.stringify({ evaluationId: result.evaluationId, status: result.status, usage: result.usage }), contentType: 'application/json' });
    //</gen>
    //<gen>playwright_ai_verify_signin
    await page.locator('[data-test="confirm-sign-up-confirmation-code-input"]').fill(result.data!.code);
    await page.locator('[data-test="confirm-sign-up-confirm-button"]').click();
    await page.locator('[data-test="username-input"]').fill(inbox.emailAddress);
    await page.locator('[data-test="sign-in-password-input"]').fill(password);
    await page.locator('[data-test="sign-in-sign-in-button"]').click();
    await expect(page.locator('[data-test="greetings-nav"]')).toBeVisible();
    //</gen>
  } finally {
    //<gen>playwright_ai_cleanup
    const deleteResponse = await request.delete(`${baseUrl}/inboxes/${inbox.id}`, { headers });
    await expect(deleteResponse).toBeOK();
    //</gen>
  }
});
