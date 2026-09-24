// Local application fixture: real signup state and MIME delivery through the MailSlurp import API.
// The browser test obtains the secret code only from AI extraction, never from a fixture response.
import http from 'node:http';
import { randomInt, randomUUID } from 'node:crypto';
const basePath = process.env.MAILSLURP_BASE_PATH, apiKey = process.env.MAILSLURP_API_KEY;
if (!basePath || !apiKey || !['localhost', '127.0.0.1'].includes(new URL(basePath).hostname)) throw new Error('Fixture requires a loopback MailSlurp API and key');
const accounts = new Map();
async function api(path, init = {}) {
  const response = await fetch(`${basePath}${path}`, { ...init, headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Fixture delivery failed (${response.status}): ${await response.text()}`);
  return response.json();
}
const html = content => `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>AI OTP fixture</title></head><body>${content}</body></html>`;
const signin = `<form method="post" action="/login"><input name="email" data-test="username-input" type="email" aria-label="Email"><input name="password" data-test="sign-in-password-input" type="password" aria-label="Password"><button data-test="sign-in-sign-in-button">Sign in</button></form><a href="/signup" data-test="sign-in-create-account-link">Create account</a>`;
const server = http.createServer(async (req, res) => {
  try {
    let body = ''; for await (const chunk of req) body += chunk;
    const form = new URLSearchParams(body);
    let content;
    if (req.method === 'GET' && req.url === '/signup') content = `<form method="post" action="/signup"><input name="email" type="email" aria-label="Email"><input name="password" type="password" aria-label="Password"><button data-test="sign-up-create-account-button">Create account</button></form>`;
    else if (req.method === 'POST' && req.url === '/signup') {
      const email = form.get('email'), password = form.get('password');
      if (!email || /[\r\n<>"']/.test(email) || !password) throw new Error('Invalid signup');
      const code = '0' + String(randomInt(10000, 100000));
      accounts.set(email, { password, code, verified: false });
      const { inboxId } = await api(`/inboxes/byEmailAddress?emailAddress=${encodeURIComponent(email)}`);
      if (!inboxId) throw new Error('Inbox not found');
      const mime = ['From: accounts@example.com', `To: ${email}`, 'Subject: Finish creating your account', `Message-ID: <${randomUUID()}@example.com>`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', '', `Welcome! Your signup confirmation code is ${code}. It expires in ten minutes.`, 'Need help? Reference number 987654. This reference is not a confirmation code.'].join('\r\n');
      await api(`/inboxes/${inboxId}/emails/import`, { method: 'POST', body: JSON.stringify({ rawEmailBase64: Buffer.from(mime).toString('base64'), runPipeline: false }) });
      content = `<form method="post" action="/verify"><input type="hidden" name="email" value="${email}"><input name="code" aria-label="Confirmation code" data-test="confirm-sign-up-confirmation-code-input"><button data-test="confirm-sign-up-confirm-button">Confirm</button></form>`;
    } else if (req.method === 'POST' && req.url === '/verify') {
      const account = accounts.get(form.get('email'));
      if (!account || account.code !== form.get('code')) { res.writeHead(400); res.end('Incorrect confirmation code'); return; }
      account.verified = true; content = signin;
    } else if (req.method === 'POST' && req.url === '/login') {
      const account = accounts.get(form.get('email'));
      if (!account?.verified || account.password !== form.get('password')) { res.writeHead(403); res.end('Sign in failed'); return; }
      content = '<nav data-test="greetings-nav">Welcome! Your account is verified.</nav>';
    } else content = signin;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' }); res.end(html(content));
  } catch (error) { console.error(error.message); res.writeHead(500); res.end('Fixture request failed'); }
}).listen(0, 'localhost', () => {
  console.log(`AI fixture ready http://localhost:${server.address().port}`);
});
