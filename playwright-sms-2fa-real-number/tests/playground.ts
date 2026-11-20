// Helpers for MailSlurp's SMS playground: a demo app at playground-sms.mailslurp.com whose sign-up
// texts a real verification code to the phone number you register. Accounts live in an AWS Cognito
// user pool, with the phone number as the username.
import { expect, type Page } from "@playwright/test";
import { GetPhoneNumbersPhoneCountryEnum, MailSlurp, type PhoneNumberProjection } from "mailslurp-client";

export const PLAYGROUND_URL = "https://playground-sms.mailslurp.com";
export const PLAYGROUND_PASSWORD = "test-password-123";

//<gen>sms_otp_playwright_phone
// Use MAILSLURP_PHONE_ID if set, otherwise the first US number in the account.
export async function findTestPhone(mailslurp: MailSlurp): Promise<{ id: string; phoneNumber: string }> {
  const pinned = process.env.MAILSLURP_PHONE_ID?.trim();
  if (pinned) return mailslurp.phoneController.getPhoneNumber({ phoneNumberId: pinned });
  const { content } = await mailslurp.phoneController.getPhoneNumbers({
    phoneCountry: GetPhoneNumbersPhoneCountryEnum.US,
  });
  const phone: PhoneNumberProjection | undefined = content?.[0];
  if (!phone) throw new Error("This test needs a US phone number in your MailSlurp account.");
  return phone;
}
//</gen>

//<gen>sms_otp_playwright_playground_code
// Exactly one six-digit code from the playground's verification text.
export function extractCode(body: string): string {
  if (!body.includes("demo-sms verification code")) throw new Error("The SMS is not a playground code.");
  const codes = body.match(/(?<!\d)\d{6}(?!\d)/g) ?? [];
  if (codes.length !== 1) throw new Error(`Expected one six-digit code, found ${codes.length}.`);
  return codes[0];
}
//</gen>

//<gen>sms_otp_playwright_sign_up
export async function signUp(page: Page, phoneNumber: string) {
  await page.goto("/");
  await page.click('[data-test="sign-in-create-account-link"]');
  // The form takes the number without its +1 country code, which the dial code select provides.
  await page.fill('[data-test="phone-number-input"]', phoneNumber.replace(/^\+1/, ""));
  await page.fill('[data-test="sign-up-non-phone-number-input"]', PLAYGROUND_PASSWORD);
  await page.click('[data-test="sign-up-create-account-button"]');
  await expect(page.locator('[data-test="confirm-sign-up-confirmation-code-input"]')).toBeVisible();
}
//</gen>

//<gen>sms_otp_playwright_confirm_and_sign_in
export async function confirmAndSignIn(page: Page, phoneNumber: string, code: string) {
  await page.fill('[data-test="confirm-sign-up-confirmation-code-input"]', code);
  await page.click('[data-test="confirm-sign-up-confirm-button"]');
  await signIn(page, phoneNumber);
  await expect(page.locator('[data-test="greetings-nav"]')).toBeVisible();
}
//</gen>

export async function signIn(page: Page, phoneNumber: string) {
  await page.fill('[data-test="username-input"]', phoneNumber);
  await page.fill('[data-test="sign-in-password-input"]', PLAYGROUND_PASSWORD);
  await page.click('[data-test="sign-in-sign-in-button"]');
}

//<gen>sms_otp_playwright_delete_user
// Delete the signed-in playground user with Cognito's DeleteUser call, so the same phone number can
// sign up again on the next run. The access token is the one the app stored when it signed in.
export async function deleteSignedInUser(page: Page) {
  const accessToken = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("CognitoIdentityServiceProvider.") && k.endsWith(".accessToken"));
    return key ? localStorage.getItem(key) : null;
  });
  if (!accessToken) throw new Error("No signed-in playground session to delete.");
  // The token's issuer names the Cognito region, for example https://cognito-idp.us-west-2.amazonaws.com/<pool>.
  const { iss } = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
  const response = await page.request.post(`${new URL(iss).origin}/`, {
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": "AWSCognitoIdentityProviderService.DeleteUser",
    },
    data: JSON.stringify({ AccessToken: accessToken }),
  });
  expect(response.ok(), `DeleteUser failed: ${await response.text()}`).toBeTruthy();
}
//</gen>

// If an earlier run stopped before cleaning up, sign in with the known password and delete that user.
export async function removeLeftoverUser(page: Page, phoneNumber: string) {
  await page.goto("/");
  await signIn(page, phoneNumber);
  const greeting = page.locator('[data-test="greetings-nav"]');
  const signInFailed = page.getByText(/User does not exist|Incorrect username or password|not confirmed/i);
  await expect(greeting.or(signInFailed).first()).toBeVisible({ timeout: 15_000 });
  if (await greeting.isVisible()) {
    await deleteSignedInUser(page);
  } else if (await page.getByText(/not confirmed/i).isVisible()) {
    throw new Error(`${phoneNumber} has an unconfirmed playground account. Use another number or finish its sign-up.`);
  }
}
