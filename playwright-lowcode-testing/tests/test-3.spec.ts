import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://test.mailslurp.com/?emailId=');
  await page.getByTestId('api-key').click();
  await page.getByTestId('api-key').fill('w');
  await page.getByTestId('submit').click();
  await page.getByTestId('copy-email').click();
  await page.goto('https://api.mailslurp.com/test-application');
  await page.getByTestId('home-signup').click();
  await page.getByPlaceholder('name@example.com').click();
  await page.getByPlaceholder('name@example.com').fill('eb72635f-a433-4817-8a1a-69b680aee87d@mailslurp.biz');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('p');
  await page.getByTestId('submit').click();
  await page.goto('https://test.mailslurp.com/?emailId=');
  await page.getByTestId('email-0').click();
  await page.getByText('Extract codes').click();
  await page.getByPlaceholder('Code is (.*)').click();
  await page.getByPlaceholder('Code is (.*)').fill('i');
});