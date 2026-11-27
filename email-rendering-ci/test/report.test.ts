// Offline checks of the target summary, the gate and the report formats. Run with: npm test
import assert from 'node:assert/strict';
import test from 'node:test';
import type { DevicePreviewTargetDto, EmailAuditAnalysisResult } from 'mailslurp-client';
import { decide, formatMarkdown, formatTable, summarizeAudit, toTargetRow } from '../src/report.ts';

function target(overrides: Partial<DevicePreviewTargetDto>): DevicePreviewTargetDto {
  return {
    id: 't1', runId: 'r1', creditCost: 1, provider: 'native', clientProfile: 'outlook_classic', platform: 'windows',
    colorScheme: 'light', status: 'READY' as DevicePreviewTargetDto['status'], failureCode: null, primaryScreenshotId: 's1',
    createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}

function analysis(overrides: Partial<EmailAuditAnalysisResult>): EmailAuditAnalysisResult {
  return {
    status: 'HEALTHY' as EmailAuditAnalysisResult['status'], healthScore: 96, totalChecks: 10, passingChecks: 10, failingChecks: 0,
    detectedLinks: 2, checkedLinks: 2, detectedImages: 0, checkedImages: 0, linkIssueCount: 0, imageIssueCount: 0,
    spellingIssueCount: 0, brokenLinks: [], brokenImages: [], spellingIssues: [], compatibilityWarningCount: 0,
    compatibilityNotSupportedCount: 0, compatibilityUnknownCount: 0, htmlErrorCount: 0, htmlWarningCount: 0, htmlInfoCount: 0,
    reputationFailureCount: 0, attachmentMentionIssueCount: 0, externalCheckSkippedCount: 0, insights: [], ...overrides,
  };
}

const ready = toTargetRow(target({ id: 'a' }), 'outlook_classic-windows-light.png');
const darkReady = toTargetRow(target({ id: 'b', clientProfile: 'ios_mail', platform: 'ios', colorScheme: 'dark' }), 'ios_mail-ios-dark.png');
const failed = toTargetRow(target({ id: 'c', clientProfile: 'gmail_android', platform: 'android', status: 'TIMED_OUT' as DevicePreviewTargetDto['status'], failureCode: 'CAPTURE_TIMEOUT' }), null);
const healthy = summarizeAudit(analysis({}));
const brokenLink = summarizeAudit(analysis({ brokenLinks: [{ url: 'https://example.com/missing', statusCode: 404, message: 'Not found' }] }));

test('names real client profiles and reads dark mode from the suffix', () => {
  const iphoneDark = toTargetRow(target({ clientProfile: 'ios_mail_physical_device_dark', platform: null, colorScheme: null }), null);
  assert.deepEqual([iphoneDark.client, iphoneDark.platform, iphoneDark.appearance], ['Apple Mail', 'iPhone', 'dark']);
  const classic = toTargetRow(target({ clientProfile: 'outlook_classic_windows', platform: null, colorScheme: null }), null);
  assert.deepEqual([classic.client, classic.platform, classic.appearance], ['Outlook (classic)', 'Windows', 'light']);
});

test('summarizes a target into a readable row', () => {
  assert.equal(ready.client, 'outlook classic');
  assert.equal(darkReady.appearance, 'dark');
  assert.equal(failed.status, 'TIMED_OUT');
  assert.equal(failed.screenshotFile, null);
});

test('fails with exit 1 when Email Audit finds a broken link', () => {
  const decision = decide([ready, darkReady], brokenLink, { failOnIncomplete: false });
  assert.equal(decision.exitCode, 1);
  assert.match(decision.message, /1 broken link\./);
});

test('passes when clients rendered and the audit is clean, and reports clients that did not render', () => {
  assert.equal(decide([ready, darkReady], healthy, { failOnIncomplete: false }).exitCode, 0);
  const partial = decide([ready, failed], healthy, { failOnIncomplete: false });
  assert.equal(partial.exitCode, 0);
  assert.match(partial.message, /1 didn't render/);
  assert.equal(decide([ready, failed], healthy, { failOnIncomplete: true }).exitCode, 2);
});

test('exits 2 when nothing rendered', () => {
  assert.equal(decide([failed], healthy, { failOnIncomplete: false }).exitCode, 2);
  assert.equal(decide([], null, { failOnIncomplete: false }).exitCode, 2);
});

test('skipping the audit leaves the render result', () => {
  assert.equal(decide([ready], null, { failOnIncomplete: false }).exitCode, 0);
});

test('formats the table and the job summary', () => {
  const table = formatTable([failed, ready, darkReady]);
  assert.match(table, /gmail android\s+android\s+light\s+TIMED_OUT \(CAPTURE_TIMEOUT\)\s+-/);
  assert.match(table, /ios mail\s+ios\s+dark\s+READY\s+ios_mail-ios-dark\.png/);
  const markdown = formatMarkdown([ready], healthy, decide([ready], healthy, { failOnIncomplete: false }), 'https://share.example/x', 'https://app.example/r');
  assert.match(markdown, /Screenshots for review \(no login needed\): https:\/\/share\.example\/x/);
  assert.match(markdown, /\| outlook classic \| windows \| light \| READY \|/);
});
