import { test, expect } from './fixtures';

test('signs in with the magic link sent to a fresh inbox', async ({ page, mailslurp, inbox, baseURL }) => {
  await test.step('request a magic link', async () => {
    await page.goto('magic-link');
    await page.getByTestId('emailAddress').fill(inbox.emailAddress);
    await page.getByTestId('submit').click();
  });

  const email = await test.step('wait for the email', async () => {
    // The inbox is new, so its latest email is the one this test requested.
    // unreadOnly=false: still works if someone opens the email in the dashboard first.
    return mailslurp.waitForLatestEmail(inbox.id, 60_000, false);
  });

  await test.step('check the email and open its link', async () => {
    expect(email.subject).toMatch(/confirm your email/i);
    const { links } = await mailslurp.emailController.getEmailLinks({
      emailId: email.id,
      selector: '.confirm-btn',
    });
    expect(links).toHaveLength(1);
    // Only follow a link that points back to the app under test.
    const link = new URL(links[0]);
    expect(link.origin).toBe(new URL(baseURL!).origin);
    await page.goto(link.href);
  });

  await expect(page.locator('[data-el="dashboard-success"]')).toBeVisible();
});
