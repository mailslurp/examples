import { createClient } from '@supabase/supabase-js';

const auth = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { flowType: 'pkce', detectSessionInUrl: false }
}).auth;
const form = document.querySelector('form');
const status = document.querySelector('[role=status]');
const identity = document.querySelector('output');
const logout = document.querySelector('#logout');

async function showAccount() {
  const { data, error } = await auth.getUser();
  const user = data.user;
  if (error && error.name !== 'AuthSessionMissingError') throw error;
  status.textContent = user ? 'Signed in' : 'Signed out';
  identity.textContent = user?.email ?? '';
  form.hidden = Boolean(user);
  logout.hidden = !user;
}
async function start() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (code || params.has('error')) {
    history.replaceState(null, '', location.pathname);
    if (!code) throw new Error('Invalid callback');
    const { error } = await auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
  await showAccount();
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const { error } = await auth.signInWithOtp({
      email: form.elements.email.value,
      options: { emailRedirectTo: location.origin + '/' }
    });
    status.textContent = error ? 'Request failed: ' + error.message : 'Check your email';
  } finally { button.disabled = false; }
});
logout.addEventListener('click', async () => {
  const { error } = await auth.signOut({ scope: 'local' });
  if (error) { status.textContent = 'Sign-out failed'; return; }
  await showAccount();
});
start().catch(() => { status.textContent = 'Could not verify this session'; });
