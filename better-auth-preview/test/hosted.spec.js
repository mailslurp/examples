import { test } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { checkPreview } from './check-preview.js';

test('each hosted preview authenticates only its own inbox', async ({ browser }) => {
  const mail = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY });
  if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY.');
  const previews = [];
  for (const suffix of ['A','B']) {
    const origin = process.env['PREVIEW_ORIGIN_' + suffix];
    const id = process.env['TEST_INBOX_ID_' + suffix];
    if (!origin || !id) throw new Error('Set the preview origin and test inbox ID for each environment.');
    const url = new URL(origin);
    if (url.protocol !== 'https:' || url.origin !== origin) throw new Error('Use the exact HTTPS origin with no trailing slash.');
    previews.push({ origin, inbox:await mail.getInbox(id) });
  }
  if (previews[0].origin === previews[1].origin || previews[0].inbox.id === previews[1].inbox.id) {
    throw new Error('Use two distinct preview origins and test inboxes.');
  }
  for (const [i, preview] of previews.entries()) {
    await checkPreview({ browser, mail, ...preview, otherOrigin:previews[1-i].origin });
  }
});
