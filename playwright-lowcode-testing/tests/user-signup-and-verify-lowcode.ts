import { test, expect } from '@playwright/test';

test('load mailslurp test page', async ({ page }) => {
  await page.goto('https://test.mailslurp.com');
  await expect(page).toHaveTitle(/MailSlurp/);
});