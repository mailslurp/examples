import { Account, Client, ID } from 'appwrite';

const account = new Account(new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID));
const form = document.querySelector('form');
const submit = form.querySelector('button');
const status = document.querySelector('[role=status]');
const heading = document.querySelector('h1');
const nav = document.querySelector('nav');
const identity = document.querySelector('output');
const logout = document.querySelector('#logout');
const params = new URLSearchParams(location.search);
const callback = new URL('/recover', location.origin);
const forms = {
  login: ['Sign in', 'Sign in'],
  signup: ['Create an account', 'Create account'],
  reset: ['Forgot your password?', 'Send recovery email'],
  update: ['Choose a new password', 'Save new password']
};
let mode;
let recovery;

function showForm(nextMode) {
  mode = nextMode;
  [heading.textContent, submit.textContent] = forms[mode];
  const password = form.elements.password;
  form.elements.email.disabled = mode === 'update';
  password.disabled = mode === 'reset';
  document.querySelector('#email-label').hidden = form.elements.email.disabled;
  document.querySelector('#password-label').hidden = password.disabled;
  document.querySelector('#password-label span').textContent = mode === 'update' ? 'New password' : 'Password';
  password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  form.hidden = false;
  nav.hidden = mode === 'update';
  status.textContent = mode === 'update' ? 'Enter the password you want to use at your next sign-in.' : 'Signed out';
}

function showAccount(user) {
  heading.textContent = 'Your account';
  identity.textContent = user.email;
  status.textContent = 'Signed in';
  logout.hidden = false;
  nav.hidden = form.hidden = true;
}

async function start() {
  if (location.pathname === callback.pathname) {
    history.replaceState(null, '', callback.pathname);
    recovery = { userId: params.get('userId'), secret: params.get('secret') };
    if (!recovery.userId || !recovery.secret) {
      status.textContent = 'Open the link in your recovery email.';
      nav.hidden = false;
      return;
    }
    showForm('update');
    return;
  }
  try {
    showAccount(await account.get());
  } catch (error) {
    if (error.code !== 401) throw error;
    const view = params.get('view');
    showForm(['signup', 'reset'].includes(view) ? view : 'login');
  }
}

form.onsubmit = async event => {
  event.preventDefault();
  submit.disabled = true;
  const email = form.elements.email.value;
  const password = form.elements.password.value;
  try {
    if (mode === 'signup') {
      await account.create({ userId: ID.unique(), email, password });
      showForm('login');
      status.textContent = 'Account created. Sign in to continue.';
    } else if (mode === 'reset') {
      await account.createRecovery({ email, url: callback.href });
      status.textContent = 'Check your email for a password reset link.';
    } else if (mode === 'update') {
      await account.updateRecovery({ ...recovery, password });
      recovery = undefined;
      heading.textContent = 'Password updated';
      status.textContent = 'You can now sign in with your new password.';
      nav.hidden = false;
      form.hidden = true;
    } else {
      await account.createEmailPasswordSession({ email, password });
      showAccount(await account.get());
    }
  } catch (error) {
    status.textContent = mode === 'login' && error.type === 'user_invalid_credentials'
      ? 'Invalid sign-in credentials' : 'Request failed. Please try again.';
  } finally {
    form.elements.password.value = '';
    submit.disabled = false;
  }
};
logout.onclick = async () => {
  try {
    await account.deleteSession({ sessionId: 'current' });
    location.replace('/');
  } catch { status.textContent = 'Sign-out failed.'; }
};
start().catch(() => { status.textContent = 'Could not load the account.'; });
