import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { magicLink } from 'better-auth/plugins/magic-link';

const form = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Preview sign-in</title>
<main><h1>Preview sign-in</h1><form><label>Email <input type="email" required name="email"></label>
<button>Send link</button></form><p role="status"></p></main>
<script>document.querySelector('form').onsubmit = async event => {
  event.preventDefault();
  const response = await fetch('/api/auth/sign-in/magic-link', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email: event.target.email.value, callbackURL:'/account' })
  });
  document.querySelector('[role=status]').textContent = response.ok ? 'Check your email' : 'Request failed';
};</script></html>`;

export async function startPreview({ origin, host, port, secret, sendLink }) {
  const database = new DatabaseSync(':memory:');
  const options = {
    database, baseURL: origin, secret,
    plugins: [magicLink({ storeToken: 'hashed', sendMagicLink: sendLink })]
  };
  const { runMigrations } = await getMigrations(options);
  await runMigrations();
  const auth = betterAuth(options);
  const handler = toNodeHandler(auth);
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, origin).pathname;
      res.setHeader('Cache-Control','no-store');
      if (path.startsWith('/api/auth/')) { await handler(req, res); return; }
      if (req.method === 'GET' && path === '/') {
        res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8' }).end(form);
      } else if (req.method === 'GET' && path === '/account') {
        const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
        res.writeHead(session ? 200 : 401, { 'Content-Type':'application/json' })
          .end(JSON.stringify(session ? { email: session.user.email } : { error:'Signed out' }));
      } else { res.writeHead(404).end(); }
    } catch { res.writeHead(500).end('Request failed'); }
  });
  await new Promise((resolve, reject) => server.once('error', reject).listen(port,host,resolve));
  return async () => {
    const closed = new Promise(resolve => server.close(resolve));
    server.closeAllConnections();
    await closed;
    database.close();
  };
}
