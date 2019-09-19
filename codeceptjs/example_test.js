Feature('Example');

/**
 * See https://codecept.io/ for more information
 */
Scenario('Can create a new inbox', async (I) => {
  const mailbox = await I.haveNewMailbox();
  await I.sendEmail({
    to: [mailbox.emailAddress],
    subject: 'Hello',
    body: 'World'
  });
  await I.waitForLatestEmail(10);
  await I.seeInEmailSubject('Hello');
  await I.seeInEmailBody('World')
});
