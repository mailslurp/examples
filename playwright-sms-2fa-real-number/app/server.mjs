// A small sign-in app with SMS two-factor authentication, for the Playwright tests in ../tests.
// Password first, then a six-digit code sent by SMS to the account's phone number.
import http from "node:http";
import { randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { createSender } from "./sms.mjs";

const port = Number(process.env.PORT ?? 4310);
const sender = createSender(process.env);
const account = {
  email: process.env.DEMO_USER_EMAIL ?? "ada@example.com",
  password: process.env.DEMO_USER_PASSWORD ?? "correct horse battery staple",
  phone: process.env.DEMO_USER_PHONE ?? "+12025550143", // a fictional 555-01XX number
};
const CODE_TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;
const pending = new Map(); // pending sign-in id -> { code, expiresAt, attempts }
const sessions = new Map(); // session id -> email

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const page = (title, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} | Demo App</title></head>
<body><main><h1>${escape(title)}</h1>${body}</main></body></html>`;

function send(res, status, html, headers = {}) {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8", ...headers });
  res.end(html);
}
function redirect(res, location, cookies = []) {
  res.writeHead(303, { location, "set-cookie": cookies });
  res.end();
}
const cookie = (name, value, maxAge) =>
  `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
function readCookies(req) {
  return Object.fromEntries((req.headers.cookie ?? "").split(";").map((part) => part.trim().split("=")).filter(([k]) => k));
}
async function readForm(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return Object.fromEntries(new URLSearchParams(raw));
}
const sameCode = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const signInForm = (error = "") => page("Sign in", `${error ? `<p role="alert">${escape(error)}</p>` : ""}
<form method="post" action="/sign-in">
  <label>Email <input name="email" type="email" autocomplete="username" required></label>
  <label>Password <input name="password" type="password" autocomplete="current-password" required></label>
  <button type="submit">Send code</button>
</form>`);
const codeForm = (error = "") => page("Enter your code", `<p>We sent a six-digit code to the phone number ending ${escape(account.phone.slice(-4))}.</p>
${error ? `<p role="alert">${escape(error)}</p>` : ""}
<form method="post" action="/verify">
  <label>Code <input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required></label>
  <button type="submit">Verify</button>
</form>`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const cookies = readCookies(req);
  try {
    if (req.method === "GET" && url.pathname === "/") return send(res, 200, signInForm());

    if (req.method === "POST" && url.pathname === "/sign-in") {
      const form = await readForm(req);
      if (form.email !== account.email || form.password !== account.password) {
        return send(res, 401, signInForm("The email or password is incorrect."));
      }
      const id = randomUUID();
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      pending.set(id, { code, expiresAt: Date.now() + CODE_TTL_MS, attempts: 0 });
      await sender.send({ to: account.phone, body: `Your Demo App sign-in code is ${code}. It expires in 5 minutes.` });
      return redirect(res, "/verify", [cookie("pending", id, 300)]);
    }

    if (req.method === "GET" && url.pathname === "/verify") {
      return pending.has(cookies.pending) ? send(res, 200, codeForm()) : redirect(res, "/");
    }

    if (req.method === "POST" && url.pathname === "/verify") {
      const login = pending.get(cookies.pending);
      if (!login) return redirect(res, "/");
      const { code = "" } = await readForm(req);
      if (Date.now() > login.expiresAt || login.attempts >= MAX_ATTEMPTS) {
        pending.delete(cookies.pending);
        return send(res, 401, signInForm("That code has expired. Sign in again for a new one."));
      }
      if (!sameCode(code.trim(), login.code)) {
        login.attempts += 1;
        return send(res, 401, codeForm("That code is incorrect."));
      }
      pending.delete(cookies.pending);
      const session = randomUUID();
      sessions.set(session, account.email);
      return redirect(res, "/account", [cookie("pending", "", 0), cookie("session", session, 3600)]);
    }

    if (req.method === "GET" && url.pathname === "/account") {
      const email = sessions.get(cookies.session);
      return email ? send(res, 200, page("Your account", `<p>Signed in as ${escape(email)}</p>`)) : redirect(res, "/");
    }

    // Like an emulator's code endpoint: only the in-memory sender exposes what it "sent".
    if (req.method === "GET" && url.pathname === "/__simulated/sms" && sender.provider === "memory") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(sender.outbox));
    }

    send(res, 404, page("Not found", "<p>No page here.</p>"));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    send(res, 500, page("Something went wrong", "<p>The code could not be sent.</p>"));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Demo app on http://127.0.0.1:${port} (SMS_PROVIDER=${sender.provider})`);
});
