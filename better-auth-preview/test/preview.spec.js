import { randomBytes } from 'node:crypto';
import { test } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { checkPreview } from './check-preview.js';
import { startPreview } from '../preview.js';
import { previewMailer } from '../mail.js';

test('each delivered link stays on its preview and signs in only there', async ({ browser }) => {
  if (!process.env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_API_KEY.');
  const mail = new MailSlurp({apiKey:process.env.MAILSLURP_API_KEY});
  const resources = [];
  const origins = ['http://localhost:4180','http://127.0.0.1:4181'];
  try {
    const sender = await mail.createInboxWithOptions({expiresIn:3600000,name:'Preview sign-in sender'});
    resources.push(() => mail.deleteInbox(sender.id));
    const inboxes = [];
    for (const origin of origins) {
      const inbox = await mail.createInboxWithOptions({expiresIn:3600000,name:'Preview sign-in recipient'});
      inboxes.push(inbox);
      resources.push(() => mail.deleteInbox(inbox.id));
      const url = new URL(origin);
      resources.push(await startPreview({origin,host:url.hostname,port:Number(url.port),
        secret:randomBytes(32).toString('hex'),sendLink:previewMailer(mail,sender.id,inbox.emailAddress)}));
    }
    for (const [i, origin] of origins.entries()) {
      const inbox = inboxes[i];
      await checkPreview({ browser, mail, inbox, origin, otherOrigin:origins[1-i] });
    }
  } finally {
    const failures = [];
    for (const cleanup of resources.reverse()) {
      try { await cleanup(); } catch { failures.push('cleanup failed'); }
    }
    if (failures.length) throw new Error('One or more temporary resources could not be cleaned up.');
  }
});
