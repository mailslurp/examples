const { expect } = require('chai');
Feature('Example');

/**
 * See https://codecept.io/ for more information
 */
Scenario('Can create a new inbox', async ({ I }) => {
  //<gen>codeceptjs_wait_for_email
  const mailbox = await I.haveNewMailbox();
  await I.sendEmail({
    to: [mailbox.emailAddress],
    subject: 'Hello',
    body: 'World'
  });
  await I.waitForLatestEmail(10);
  await I.seeInEmailSubject('Hello');
  await I.seeInEmailBody('World')
  //</gen>
});
Scenario('Can extract verification code', async ({ I }) => {
  const mailbox = await I.haveNewMailbox();
  await I.sendEmail({
    to: [mailbox.emailAddress],
    subject: 'Verify your account',
    body: 'Your code is: 123-456'
  });
  //<gen>codeceptjs_wait_for_matching_extract
  const email = await I.waitForEmailMatching({
    subject: 'Verify your account',
  })
  const [_, code] = /Your code is: ([0-9-]{7})/.exec(email.body)
  //</gen>
  expect(code).eq('123-456')
});
