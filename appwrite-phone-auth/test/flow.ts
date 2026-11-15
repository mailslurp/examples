import { expect, type Page } from '@playwright/test';

export async function requestCode(page: Page, phone: string) {
  await page.goto('/');
  await page.getByLabel('Phone number').fill(phone);
  const since = new Date();
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.getByRole('status')).toHaveText('Enter the code', { timeout: 15_000 });
  return since;
}

export async function submitCode(page: Page, code: string) {
  // Keep the value out of Playwright's fill-action diagnostics.
  await page.getByLabel('Verification code').evaluate((input, value) => {
    (input as HTMLInputElement).value = value;
  }, code);
  await page.getByRole('button', { name: 'Verify code' }).click();
}

export async function endSession(page: Page) {
  const logout = page.getByRole('button', { name: 'End test session' });
  if (await logout.isVisible()) {
    await logout.click();
    await expect(page.getByRole('status')).toHaveText('Session ended', { timeout: 15_000 });
  }
}
