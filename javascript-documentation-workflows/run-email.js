import { MailSlurp } from 'mailslurp-client';
import { emailOtp, sendEmail } from './workflows.js';
const apiKey = process.env.MAILSLURP_API_KEY || process.env.API_KEY;
if (!apiKey) throw new Error('Set MAILSLURP_API_KEY before running');
const mailslurp = new MailSlurp({ apiKey });
await emailOtp(mailslurp);
await sendEmail(mailslurp);
