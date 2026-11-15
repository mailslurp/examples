import { Account, Client, ID } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
const account = new Account(client);
const request = document.querySelector<HTMLFormElement>('#request')!;
const verify = document.querySelector<HTMLFormElement>('#verify')!;
const logout = document.querySelector<HTMLButtonElement>('#logout')!;
const status = document.querySelector<HTMLElement>('[role=status]')!;
const phone = request.querySelector('input')!;
const code = verify.querySelector('input')!;
let userId = '';

request.onsubmit = async (event) => {
  event.preventDefault();
  const button = request.querySelector('button')!;
  button.disabled = true;
  try {
    const token = await account.createPhoneToken({ userId: ID.unique(), phone: phone.value });
    userId = token.userId;
    request.hidden = true;
    verify.hidden = false;
    status.textContent = 'Enter the code';
  } catch {
    status.textContent = 'Phone token request failed';
    button.disabled = false;
  }
};

verify.onsubmit = async (event) => {
  event.preventDefault();
  const button = verify.querySelector('button')!;
  button.disabled = true;
  try {
    const session = await account.createSession({ userId, secret: code.value });
    logout.hidden = false;
    const user = await account.get();
    if (session.userId !== userId || user.$id !== userId || user.phone !== phone.value) {
      throw new Error('Account mismatch');
    }
    verify.hidden = true;
    status.textContent = 'Signed in to the expected account';
  } catch {
    status.textContent = 'Session or account verification failed';
    button.disabled = false;
  } finally {
    code.value = '';
  }
};

logout.onclick = async () => {
  logout.disabled = true;
  try {
    await account.deleteSession({ sessionId: 'current' });
    logout.hidden = true;
    status.textContent = 'Session ended';
  } catch {
    status.textContent = 'Session cleanup failed';
  }
};
