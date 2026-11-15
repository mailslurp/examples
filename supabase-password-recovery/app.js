import { createClient } from '@supabase/supabase-js';

const { auth } = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { flowType: 'pkce', detectSessionInUrl: false }
});
const form = document.querySelector('form');
const submit = form.querySelector('button');
const status = document.querySelector('p[role=status]');
const heading = document.querySelector('h1');
const logout = document.querySelector('#logout');
const nav = document.querySelector('nav');
const identity = document.querySelector('output');
const callback = location.origin + '/';
const params = new URLSearchParams(location.search);
let view = params.get('view');
if (!['signup','reset'].includes(view)) view = 'login';

function showForm(mode) {
  view = mode;
  const labels = {
    login: ['Sign in', 'Sign in'], signup: ['Create an account', 'Create account'],
    reset: ['Forgot your password?', 'Send recovery email'], update: ['Choose a new password', 'Save new password']
  };
  [heading.textContent, submit.textContent] = labels[view];
  form.elements.email.disabled = view === 'update';
  document.querySelector('#email-label').hidden = form.elements.email.disabled;
  form.elements.password.disabled = view === 'reset';
  document.querySelector('#password-label').hidden = form.elements.password.disabled;
  document.querySelector('#password-label span').textContent = view === 'update' ? 'New password' : 'Password';
  form.elements.password.autocomplete = view === 'login' ? 'current-password' : 'new-password';
  status.textContent = view === 'update' ? 'Recovery link verified' : 'Signed out';
  form.hidden = false;
  nav.hidden = view === 'update';
}
async function showAccount() {
  const { data, error } = await auth.getUser();
  if (error) throw error;
  identity.textContent = data.user.email;
  heading.textContent = 'Your account';
  status.textContent = 'Signed in';
  form.hidden = nav.hidden = true;
  logout.hidden = false;
}
async function start() {
  const code = params.get('code');
  if (code || params.has('error') || location.hash.includes('error=')) {
    history.replaceState(null, '', '/');
    if (!code) throw new Error('Invalid link');
    const { data, error } = await auth.exchangeCodeForSession(code);
    if (error) throw error;
    if (data.redirectType === 'recovery') { showForm('update'); return; }
    await showAccount();
    return;
  }
  const { data, error } = await auth.getSession();
  if (error) throw error;
  if (data.session) await showAccount();
  else showForm(view);
}
form.onsubmit = async event => {
  event.preventDefault();
  submit.disabled = true;
  const email = form.elements.email.value;
  const password = form.elements.password.value;
  try {
    if (view === 'reset') {
      const { error } = await auth.resetPasswordForEmail(email, { redirectTo: callback });
      if (error) throw error;
      status.textContent = 'If an account exists, check your email.';
    } else if (view === 'signup') {
      const { error } = await auth.signUp({ email, password, options: { emailRedirectTo: callback } });
      if (error) throw error;
      status.textContent = 'Check your signup email';
    } else if (view === 'update') {
      const { error } = await auth.updateUser({ password });
      if (error) throw error;
      form.hidden = true;
      heading.textContent = 'Password updated';
      status.textContent = 'Your new password has been saved.';
      logout.hidden = false;
    } else {
      const { error } = await auth.signInWithPassword({ email, password });
      if (error) throw error;
      await showAccount();
    }
  } catch (error) {
    status.textContent = error.code === 'invalid_credentials' ? 'Invalid sign-in credentials' : 'Request failed';
  } finally {
    form.elements.password.value = '';
    submit.disabled = false;
  }
};
logout.onclick = async () => {
  const { error } = await auth.signOut({ scope: 'local' });
  if (error) status.textContent = 'Sign-out failed';
  else location.replace('/');
};
start().catch(() => { status.textContent = 'Could not verify this session or email link'; nav.hidden = false; });
