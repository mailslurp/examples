import { MailSlurp, SmsMatchOptionFieldEnum, SmsMatchOptionShouldEnum } from 'mailslurp-client';
import type { SmsPreview } from 'mailslurp-client';

export function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('Set ' + name + ' before running the staging test.');
  return value;
}

export function extractCode(sms: Pick<SmsPreview, 'phoneNumber' | 'createdAt' | 'body'>,
  phoneId: string, since: Date, marker: string): string {
  if (sms.phoneNumber !== phoneId || !(sms.createdAt >= since) || !sms.body.includes(marker)) {
    throw new Error('The SMS did not match this number, start time and project marker.');
  }
  const matches = sms.body.match(/(?<!\d)\d{6}(?!\d)/g) ?? [];
  if (matches.length !== 1) throw new Error('Expected one six-digit code in the matching SMS.');
  return matches[0];
}

export async function realNumber(client: MailSlurp, phoneId: string, marker: string) {
  const phone = await client.phoneController.getPhoneNumber({ phoneNumberId: phoneId })
    .catch(() => { throw new Error('MailSlurp number lookup failed. Check the key and number ID.'); });
  return {
    phone: phone.phoneNumber,
    async codeSince(since: Date) {
      const messages = await client.waitController.waitForSms({
        waitForSmsConditions: {
          phoneNumberId: phoneId, since, timeout: 60_000, count: 1,
          matches: [{ field: SmsMatchOptionFieldEnum.BODY,
            should: SmsMatchOptionShouldEnum.CONTAIN, value: marker }],
        },
      }).catch(() => { throw new Error('No matching SMS returned. Check delivery, template and MailSlurp access.'); });
      if (messages.length !== 1) throw new Error('Expected one matching SMS. Check for overlapping runs.');
      return extractCode(messages[0], phoneId, since, marker);
    },
  };
}
