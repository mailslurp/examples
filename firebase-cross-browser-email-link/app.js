import { initializeApp } from 'firebase/app';
import { getAuth, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signOut } from 'firebase/auth';

const auth = getAuth(initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
}));
const form = document.querySelector('form');
const button = form.querySelector('button');
const status = document.querySelector('[role=status]');
const identity = document.querySelector('output');
const leave = document.querySelector('#leave');
const pending = 'emailForSignIn';
let link = isSignInWithEmailLink(auth, location.href) ? location.href : null;

function showUser(user) {
  status.textContent = 'Signed in';
  identity.textContent = user.email;
  form.hidden = true;
  leave.hidden = false;
}
async function finish(email) {
  const result = await signInWithEmailLink(auth, email, link);
  localStorage.removeItem(pending);
  link = null;
  history.replaceState(null, '', '/');
  showUser(result.user);
}
async function start() {
  await auth.authStateReady();
  if (link) {
    status.textContent = 'Confirm the email address that received this link.';
    button.textContent = 'Confirm email';
    form.hidden = false;
    const email = localStorage.getItem(pending);
    if (email) await finish(email);
  } else if (auth.currentUser) {
    showUser(auth.currentUser);
  } else {
    status.textContent = 'Signed out';
    form.hidden = false;
  }
}
form.onsubmit = async event => {
  event.preventDefault();
  button.disabled = true;
  const email = form.elements.email.value.trim();
  try {
    if (link) await finish(email);
    else {
      await sendSignInLinkToEmail(auth, email, { url: location.origin + '/', handleCodeInApp: true });
      localStorage.setItem(pending, email);
      status.textContent = 'Check your email for a sign-in link.';
    }
  } catch (error) {
    status.textContent = 'Sign-in request failed (' + error.code + ').';
  } finally { button.disabled = false; }
};
leave.onclick = async () => { await signOut(auth); location.replace('/'); };
start().catch(() => { status.textContent = 'Could not finish sign-in. Request a new link or confirm your address.'; });
