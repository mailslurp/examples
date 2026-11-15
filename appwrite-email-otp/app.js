import { Account, Client, ID } from 'appwrite';
const account = new Account(new Client().setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID));
const request = document.querySelector('#request');
const verify = document.querySelector('#verify');
const status = document.querySelector('p[role=status]');
const identity = document.querySelector('output');
const logout = document.querySelector('#logout');
let challengedUser;

async function showAccount() {
  try {
    const user = await account.get();
    if (challengedUser && user.$id !== challengedUser) throw new Error('Account mismatch');
    identity.textContent = user.email;
    status.textContent = 'Signed in';
    logout.hidden = false;
    request.hidden = verify.hidden = true;
  } catch (error) {
    if (error.code !== 401) throw error;
    identity.textContent = '';
    status.textContent = 'Signed out';
    request.hidden = false;
    logout.hidden = verify.hidden = true;
  }
}
request.onsubmit = async event => {
  event.preventDefault();
  const button = request.querySelector('button');
  button.disabled = true;
  try {
    const token = await account.createEmailToken({ userId: ID.unique(), email: request.elements.email.value });
    challengedUser = token.userId;
    request.hidden = true;
    verify.hidden = false;
    status.textContent = 'Check your email';
  } catch (error) { status.textContent = 'Email request failed: ' + error.message; }
  finally { button.disabled = false; }
};
verify.onsubmit = async event => {
  event.preventDefault();
  const button = verify.querySelector('button');
  button.disabled = true;
  try {
    await account.createSession({ userId: challengedUser, secret: verify.elements.code.value });
    await showAccount();
  } catch { status.textContent = 'Could not verify this code'; }
  finally { verify.reset(); button.disabled = false; }
};
logout.onclick = async () => {
  try {
    await account.deleteSession({ sessionId: 'current' });
    challengedUser = undefined;
    await showAccount();
  } catch { status.textContent = 'Could not end session'; }
};
showAccount().catch(() => { status.textContent = 'Could not load account'; });
