// Sends the test email to each seed through your own SMTP server or ESP SMTP relay.
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export function openSmtp(env: NodeJS.ProcessEnv): Transporter {
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port <= 0) throw new Error('SMTP_PORT must be a port number');
  return nodemailer.createTransport({
    host: required(env, 'SMTP_HOST'),
    port,
    // Port 465 uses implicit TLS. Other ports start plain and upgrade with STARTTLS.
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

export function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

export interface TestEmail {
  from: string | { name: string; address: string };
  subject: string;
  html: string;
}

//<gen>inbox_placement_ci_02_send_seeds
// Send one message per seed, the way a campaign reaches each subscriber, from the domain
// and ESP you want to measure. The tracking token in the subject lets MailSlurp match it.
export async function sendToSeeds(smtp: Transporter, email: TestEmail, trackingToken: string, seedAddresses: string[]) {
  const subject = `${email.subject} ${trackingToken}`;
  for (const to of seedAddresses) {
    await smtp.sendMail({ from: email.from, to, subject, html: email.html });
  }
}
//</gen>
