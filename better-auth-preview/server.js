import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
import { MailSlurp } from 'mailslurp-client';
import { startPreview } from './preview.js';
import { previewMailer } from './mail.js';
const env = process.env;
const port = Number(env.PORT || 4180);
const origin = env.PREVIEW_ORIGIN || (env.RAILWAY_PUBLIC_DOMAIN && 'https://' + env.RAILWAY_PUBLIC_DOMAIN);
for (const key of ['BETTER_AUTH_SECRET','MAILSLURP_API_KEY','SENDER_INBOX_ID','TEST_RECIPIENT']) {
  if (!env[key]) throw new Error('Set ' + key);
}
if (!origin || new URL(origin).origin !== origin) throw new Error('Set PREVIEW_ORIGIN to the exact public origin.');
await startPreview({ origin, host: env.RAILWAY_PUBLIC_DOMAIN ? '0.0.0.0' : '127.0.0.1', port,
  secret: env.BETTER_AUTH_SECRET,
  sendLink: previewMailer(new MailSlurp({apiKey:env.MAILSLURP_API_KEY}),env.SENDER_INBOX_ID,env.TEST_RECIPIENT)
});
