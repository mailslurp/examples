import { expect, type Page } from "@playwright/test";

export const demoUser = { email: "ada@example.com", password: "correct horse battery staple" };
//<gen>sms_otp_playwright_flow
export const codeMarker = "Demo App sign-in code";

export async function submitPassword(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill(demoUser.email);
  await page.getByLabel("Password").fill(demoUser.password);
  await page.getByRole("button", { name: "Send code" }).click();
  await expect(page.getByRole("heading", { name: "Enter your code" })).toBeVisible();
}
//</gen>

export async function submitCode(page: Page, code: string) {
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
}

export async function expectSignedIn(page: Page) {
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText(`Signed in as ${demoUser.email}`)).toBeVisible();
}

//<gen>sms_otp_playwright_extract_code
// Exactly one six-digit code from a message that carries the app's wording.
export function extractCode(body: string): string {
  if (!body.includes(codeMarker)) throw new Error("The SMS is not a Demo App sign-in code.");
  const codes = body.match(/(?<!\d)\d{6}(?!\d)/g) ?? [];
  if (codes.length !== 1) throw new Error(`Expected one six-digit code, found ${codes.length}.`);
  return codes[0];
}
//</gen>
