// Fast checks with the in-memory sender. No credentials, no phone, no network.
// These prove the sign-in flow and code handling, not that a text ever reaches a phone.
import { expect, test, type APIRequestContext } from "@playwright/test";
import { expectSignedIn, extractCode, submitCode, submitPassword } from "./flow";

//<gen>sms_otp_playwright_simulated
async function lastSimulatedCode(request: APIRequestContext): Promise<string> {
  const outbox: { body: string }[] = await (await request.get("/__simulated/sms")).json();
  return extractCode(outbox.at(-1)!.body);
}

test("signs in with the code from the simulated SMS", async ({ page, request }) => {
  await submitPassword(page);
  await submitCode(page, await lastSimulatedCode(request));
  await expectSignedIn(page);
});
//</gen>

//<gen>sms_otp_playwright_negative
test("rejects an incorrect code", async ({ page, request }) => {
  await submitPassword(page);
  const code = await lastSimulatedCode(request);
  const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, "0");
  await submitCode(page, wrong);
  await expect(page.getByRole("alert")).toHaveText("That code is incorrect.");
  await page.goto("/account");
  await expect(page).toHaveURL(/\/$/);
});

test("does not accept a code twice", async ({ page, request, context }) => {
  await submitPassword(page);
  const pending = (await context.cookies()).find((c) => c.name === "pending");
  const code = await lastSimulatedCode(request);
  await submitCode(page, code);
  await expectSignedIn(page);

  // Replay the same pending sign-in and code from another client.
  const replay = await request.post("/verify", {
    form: { code },
    headers: { cookie: `pending=${pending?.value}` },
    maxRedirects: 0,
  });
  expect(replay.status()).toBe(303);
  expect(replay.headers().location).toBe("/");
});
//</gen>

test("parses only the app's six-digit code", () => {
  expect(extractCode("Your Demo App sign-in code is 042913. It expires in 5 minutes.")).toBe("042913");
  expect(() => extractCode("Your bank code is 123456")).toThrow();
  expect(() => extractCode("Your Demo App sign-in code is 1234567.")).toThrow();
});
