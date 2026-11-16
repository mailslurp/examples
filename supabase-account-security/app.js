import { createClient } from '@supabase/supabase-js';

const { auth } = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const el = id => document.getElementById(id);
const status = document.querySelector('[role=status]');
const callback = location.origin + '/';
let factorId;

function data(result) {
  if (result.error) throw result.error;
  return result.data;
}

async function refresh() {
  const { session } = data(await auth.getSession());
  el('login').hidden = !!session;
  el('settings').hidden = !session;
  if (!session) return;
  const { user } = data(await auth.getUser());
  const levels = data(await auth.mfa.getAuthenticatorAssuranceLevel());
  el('address').textContent = user.email;
  el('address').dataset.userId = user.id;
  el('pending').textContent = user.new_email ? 'Awaiting confirmation' : 'No pending change';
  el('level').textContent = levels.currentLevel;
  el('next').textContent = levels.nextLevel;
}

function on(id, action) {
  el(id).onclick = async () => {
    status.textContent = '';
    el(id).disabled = true;
    try {
      const message = await action();
      await refresh();
      status.textContent = message || '';
    } catch (error) { status.textContent = error.message; }
    finally { el(id).disabled = false; }
  };
}
const credentials = () => ({ email: el('email').value, password: el('password').value });
on('signup', async () => {
  data(await auth.signUp({ ...credentials(), options: { emailRedirectTo: callback } }));
  el('password').value = '';
  return 'Check your signup email';
});
on('signin', async () => {
  data(await auth.signInWithPassword(credentials()));
  el('password').value = '';
});
on('signout', async () => {
  data(await auth.signOut());
  location.reload();
});
on('refresh', async () => 'Account refreshed');
on('change', async () => {
  data(await auth.updateUser({ email: el('replacement').value }, { emailRedirectTo: callback }));
  return 'Email change requested';
});
on('enroll', async () => {
  const factor = data(await auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Test authenticator' }));
  factorId = factor.id;
  el('qr').src = factor.totp.qr_code;
  el('setup').hidden = false;
});
on('verify', async () => {
  const id = factorId || data(await auth.mfa.listFactors()).totp[0]?.id;
  if (!id) throw new Error('Set up an authenticator first.');
  const code = el('otp').value;
  el('otp').value = '';
  data(await auth.mfa.challengeAndVerify({ factorId: id, code }));
  el('setup').hidden = true;
  el('qr').removeAttribute('src');
  factorId = undefined;
  return 'Authenticator verified';
});
refresh().catch(error => { status.textContent = error.message; });
