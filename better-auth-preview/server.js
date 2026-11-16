import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
import { AgentControllerApi, Configuration, MailSlurp } from 'mailslurp-client';
import { startPreview } from './preview.js';
import { previewMailer } from './mail.js';
const env = process.env;
const port = Number(env.PORT || 4180);
const origin = env.PREVIEW_ORIGIN || (env.RAILWAY_PUBLIC_DOMAIN && 'https://' + env.RAILWAY_PUBLIC_DOMAIN);
for (const key of ['BETTER_AUTH_SECRET','SENDER_INBOX_ID','TEST_RECIPIENT']) {
  if (!env[key]) throw new Error('Set ' + key);
}
if (!origin || new URL(origin).origin !== origin) throw new Error('Set PREVIEW_ORIGIN to the exact public origin.');
// A hosted preview only needs access to its own sender inbox.
let sendEmail;
if (env.MAILSLURP_SENDER_KEY) {
  const agent = new AgentControllerApi(new Configuration({ apiKey: env.MAILSLURP_SENDER_KEY }));
  sendEmail = async sendEmailOptions => {
    const inboxId = env.SENDER_INBOX_ID;
    const draft = await agent.agentCreateEmailDraft({ inboxId, sendEmailOptions });
    await agent.agentSendEmailDraft({ inboxId, draftId: draft.id, idempotencyKey: draft.id });
  };
} else {
  if (!env.MAILSLURP_API_KEY) throw new Error('Set MAILSLURP_SENDER_KEY on the preview or MAILSLURP_API_KEY locally.');
  const mail = new MailSlurp({ apiKey: env.MAILSLURP_API_KEY });
  sendEmail = message => mail.sendEmail(env.SENDER_INBOX_ID, message);
}
await startPreview({ origin, host: env.RAILWAY_PUBLIC_DOMAIN ? '0.0.0.0' : '127.0.0.1', port,
  secret: env.BETTER_AUTH_SECRET,
  sendLink: previewMailer(sendEmail, env.TEST_RECIPIENT)
});
