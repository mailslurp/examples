import { test, expect } from './fixtures';

// Three users sign up at the same time. Each test has its own inbox, so each one
// receives exactly its own link, even with fullyParallel enabled.
for (const user of ['ana', 'ben', 'chloe']) {
  test(`${user} receives only their own magic link`, async ({ page, mailslurp, inbox }) => {
    await page.goto('magic-link');
    await page.getByTestId('emailAddress').fill(inbox.emailAddress);
    await page.getByTestId('submit').click();

    const email = await mailslurp.waitForLatestEmail(inbox.id, 60_000, true);
    expect(email.to).toContain(inbox.emailAddress);

    const { links } = await mailslurp.emailController.getEmailLinks({
      emailId: email.id,
      selector: '.confirm-btn',
    });
    await page.goto(links[0]);
    await expect(page.locator('[data-el="dashboard-success"]')).toBeVisible();
  });
}
