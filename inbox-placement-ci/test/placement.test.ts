// Offline checks of the classification and gate, using target shapes recorded from a real test.
// Addresses are placeholders. Run with: npm test
import assert from 'node:assert/strict';
import test from 'node:test';
import type { InboxPlacementTargetResultDto } from 'mailslurp-client';
import { classifyTarget, decide, formatTable, maskAddress, parseFamilies, providerFamily, toSeedResult } from '../src/placement.ts';

function target(overrides: Partial<InboxPlacementTargetResultDto>): InboxPlacementTargetResultDto {
  return {
    seedAccountId: 1, seedAddress: 'seed@example.com', provider: 'Gmail Consumer', segment: 'PERSONAL',
    status: 'RESULT_READY', placementVerdict: null, placementFolder: null, receivedAt: null, latencyMs: null,
    evidence: {}, ...overrides,
  };
}

const gmailSpam = target({ provider: 'Gmail Consumer', seedAddress: 'one@gmail.com', placementVerdict: 'SPAM', placementFolder: 'SPAM', receivedAt: new Date(), latencyMs: 2266 });
const workspaceInbox = target({ provider: 'Gmail Workspace', seedAddress: 'two@workspace.example', placementVerdict: 'PRIMARY', placementFolder: 'INBOX', receivedAt: new Date() });
const outlookJunk = target({ provider: 'Outlook Personal', seedAddress: 'three@outlook.com', placementVerdict: 'SPAM', placementFolder: 'junkemail', receivedAt: new Date() });
const m365Focused = target({ provider: 'Microsoft 365', seedAddress: 'four@m365.example', placementVerdict: 'FOCUSED', placementFolder: 'inbox', receivedAt: new Date() });
const gmailPromotions = target({ provider: 'Gmail Consumer', seedAddress: 'five@gmail.com', placementVerdict: 'PROMOTIONS', placementFolder: 'INBOX', receivedAt: new Date() });
const outlookNotReceived = target({ provider: 'Outlook Personal', seedAddress: 'six@outlook.com', status: 'TIMED_OUT', placementVerdict: 'NOT_RECEIVED' });
const outlookWaiting = target({ provider: 'Microsoft 365', seedAddress: 'seven@m365.example', status: 'ACTIVE_WAIT' });
const yahooSpam = target({ provider: 'Yahoo', seedAddress: 'eight@yahoo.com', placementVerdict: 'SPAM', placementFolder: 'Bulk', receivedAt: new Date() });

const gate = { families: parseFamilies(undefined), failOnMissing: false };

test('groups seed providers into Gmail and Outlook families', () => {
  assert.equal(providerFamily('Gmail Consumer'), 'gmail');
  assert.equal(providerFamily('Gmail Workspace'), 'gmail');
  assert.equal(providerFamily('Outlook Personal'), 'outlook');
  assert.equal(providerFamily('Microsoft 365'), 'outlook');
  assert.equal(providerFamily('Yahoo'), 'yahoo');
});

test('reads spam, junk, inbox, tabs and missing from seed results', () => {
  assert.equal(classifyTarget(gmailSpam), 'spam');
  assert.equal(classifyTarget(outlookJunk), 'spam');
  assert.equal(classifyTarget(workspaceInbox), 'inbox');
  assert.equal(classifyTarget(m365Focused), 'inbox');
  assert.equal(classifyTarget(gmailPromotions), 'tab');
  assert.equal(classifyTarget(outlookNotReceived), 'missing');
  assert.equal(classifyTarget(outlookWaiting), 'missing');
  assert.equal(classifyTarget(target({ placementFolder: 'Junk Email', receivedAt: new Date() })), 'spam');
  assert.equal(toSeedResult(outlookWaiting).stillWaiting, true);
  assert.equal(toSeedResult(outlookNotReceived).stillWaiting, false);
});

test('fails with exit 1 when a Gmail or Outlook seed reports spam', () => {
  const decision = decide([gmailSpam, workspaceInbox, m365Focused].map(toSeedResult), gate);
  assert.equal(decision.exitCode, 1);
  assert.match(decision.message, /1 of 3 Gmail or Outlook seeds/);
  assert.equal(decide([outlookJunk, m365Focused].map(toSeedResult), gate).exitCode, 1);
});

test('does not gate on providers outside the list', () => {
  assert.equal(decide([yahooSpam, workspaceInbox, m365Focused].map(toSeedResult), gate).exitCode, 0);
  assert.equal(decide([yahooSpam, m365Focused].map(toSeedResult), { ...gate, families: parseFamilies('gmail,outlook,yahoo') }).exitCode, 1);
});

test('keeps missing separate from inbox', () => {
  const someMissing = decide([workspaceInbox, outlookNotReceived].map(toSeedResult), gate);
  assert.equal(someMissing.exitCode, 0);
  assert.match(someMissing.message, /1 had no result and were not counted as inbox/);
  assert.equal(decide([workspaceInbox, outlookNotReceived].map(toSeedResult), { ...gate, failOnMissing: true }).exitCode, 2);
  assert.equal(decide([outlookNotReceived, outlookWaiting].map(toSeedResult), gate).exitCode, 2);
  assert.equal(decide([yahooSpam].map(toSeedResult), gate).exitCode, 2);
});

test('a Promotions tab result passes the spam gate', () => {
  assert.equal(decide([gmailPromotions, m365Focused].map(toSeedResult), gate).exitCode, 0);
});

test('prints a per-provider table and masks seed addresses', () => {
  const table = formatTable([gmailSpam, gmailPromotions, outlookJunk, m365Focused, yahooSpam].map(toSeedResult), gate.families);
  assert.match(table, /Gmail Consumer\s+2\s+0\s+1\s+1\s+0\s+0\s+yes/);
  assert.match(table, /Yahoo\s+1\s+0\s+0\s+1\s+0\s+0\s+no/);
  assert.equal(maskAddress('damien@gmail.com'), 'da***@gm***.com');
  assert.equal(maskAddress('seed@mail.example.co'), 'se***@ma***.co');
  assert.throws(() => parseFamilies('gmail,aol'), /unknown values: aol/);
});
