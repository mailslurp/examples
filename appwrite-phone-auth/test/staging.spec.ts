import { expect, test } from '@playwright/test';
import { MailSlurp } from 'mailslurp-client';
import { endSession, requestCode, submitCode } from './flow';
import { realNumber, required } from './sms';

test('phone login creates a session for the expected staging account', async ({ page }, info) => {
  let phone: string;
  let getCode: (since: Date) => Promise<string>;
  if (info.project.name === 'sms') {
    const client = new MailSlurp({ apiKey: required('MAILSLURP_API_KEY') });
    const number = await realNumber(client, required('MAILSLURP_PHONE_ID'), required('APPWRITE_SMS_MARKER'));
    phone = number.phone;
    getCode = number.codeSince;
  } else {
    phone = required('APPWRITE_MOCK_PHONE');
    const code = required('APPWRITE_MOCK_CODE');
    getCode = async () => code;
  }
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) throw new Error('A staging phone in E.164 format is required.');
  try {
    const since = await requestCode(page, phone);
    await submitCode(page, await getCode(since));
    await expect(page.getByRole('status')).toHaveText('Signed in to the expected account', { timeout: 15_000 });
  } finally {
    await endSession(page);
  }
});
