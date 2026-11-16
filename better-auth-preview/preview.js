import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { betterAuth } from 'better-auth';
import { getMigrations } from 'better-auth/db/migration';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { magicLink } from 'better-auth/plugins/magic-link';

const form = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview sign-in</title>
<style>
:root{font:17px/1.55 system-ui,sans-serif;color:#172a32;background:#f4f8f7}
main{box-sizing:border-box;max-width:32rem;margin:10vh auto;padding:2rem;background:white;border:1px solid #c4d7ce;border-radius:12px}
h1{margin:0 0 1rem}button,input{font:inherit;padding:.55rem .8rem;border-radius:5px}input{display:block;box-sizing:border-box;width:100%;margin:.4rem 0 1rem;border:1px solid #83988d}button{background:#235640;color:white;border:0}output{overflow-wrap:anywhere}
</style>
<main><h1>Preview sign-in</h1><p>Preview host: <strong id="host"></strong></p>
<form hidden><label>Email <input type="email" required name="email"></label><button>Send link</button></form>
<p role="status">Checking session...</p><output aria-label="Account email"></output></main>
<script>
const form = document.querySelector('form');
const status = document.querySelector('p[role=status]');
document.querySelector('#host').textContent = location.host;
fetch('/account').then(async response => {
  if (response.status === 401) {
    status.textContent = 'Signed out';
    form.hidden = false;
  } else if (response.ok) {
    const account = await response.json();
    document.querySelector('output').textContent = account.email;
    status.textContent = 'Signed in';
  } else throw new Error();
}).catch(() => { status.textContent = 'Could not read session'; });
form.onsubmit = async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch('/api/auth/sign-in/magic-link', {
      method: 'POST', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email: form.elements.email.value, callbackURL:'/account' })
    });
    status.textContent = response.ok ? 'Check your email' : 'Request failed';
  } catch { status.textContent = 'Request failed'; }
  finally { button.disabled = false; }
};
</script></html>`;

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
