import { test, expect } from '@playwright/test';

test('test using test.mailslurp.com', async ({ page, context }) => {
  const password = 'test-password';
  const apiKey = process.env.API_KEY;
  expect(apiKey, 'API_KEY environment variable should be set').toBeTruthy()
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto('https://test.mailslurp.com/?emailId=');
  await page.getByTestId('api-key').click();
  await page.getByTestId('api-key').click();
  await page.getByTestId('api-key').fill(apiKey);
  await page.getByTestId('submit').click();
  await page.getByTestId('copy-email').click();
  const emailAddress = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto('https://api.mailslurp.com/test-application/sign-up');
  await page.getByPlaceholder('name@example.com').click();
  await page.getByPlaceholder('name@example.com').fill(emailAddress);
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill(password);
  await page.getByTestId('submit').click();
  await page.goto('https://test.mailslurp.com/?emailId=');
  await page.getByTestId('email-0').click();
  await page.getByTestId('tab-codes').click();
  await page.getByTestId('regex-input').click();
  await page.getByTestId('regex-input').fill('is "(.+)"');
  await page.getByTestId('submit-regex').click();
  await page.locator('div').filter({ hasText: /^1\[data-testid="match-item-1"\]\[data-testid="match-item-1"\]$/ }).getByRole('button').click();
  const code = await page.evaluate(() => navigator.clipboard.readText());

  await page.goto('https://api.mailslurp.com/test-application/confirm');
  await page.getByPlaceholder('Code').click();
  await page.getByPlaceholder('Code').fill(code);
  await page.getByPlaceholder('name@example.com').click();
  await page.getByPlaceholder('name@example.com').fill(emailAddress);
  await page.getByTestId('submit').click();
  await page.getByPlaceholder('name@example.com').click();
  await page.getByPlaceholder('name@example.com').fill(emailAddress);
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page.getByText('It all looks strawberry!')).toBeVisible();
});