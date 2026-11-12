import { test as base, expect } from '@playwright/test';
import { MailSlurp, InboxDto } from 'mailslurp-client';

type EmailFixtures = {
  mailslurp: MailSlurp;
  inbox: InboxDto;
};

export const test = base.extend<EmailFixtures>({
  mailslurp: async ({}, use) => {
    const apiKey = process.env.MAILSLURP_API_KEY;
    if (!apiKey) {
      throw new Error('Set MAILSLURP_API_KEY. A free key is at https://app.mailslurp.com/sign-up/');
    }
    await use(new MailSlurp({ apiKey }));
  },

  // Every test gets its own real email address, so parallel tests never read each other's mail.
  // The inbox expires on its own after ten minutes; nothing to clean up.
  inbox: async ({ mailslurp }, use) => {
    const inbox = await mailslurp.createInboxWithOptions({ expiresIn: 10 * 60_000 });
    await use(inbox);
  },
});

export { expect };
