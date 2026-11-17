import { defineConfig } from "@playwright/test";

const port = Number(process.env.PORT ?? 4310);
const realRun = process.argv.some((arg) => arg === "--project=sms" || arg === "sms");

// For the real run, the demo account's phone is the MailSlurp number that receives the code.
async function mailslurpNumber(): Promise<string> {
  const apiKey = process.env.MAILSLURP_API_KEY?.trim();
  const phoneId = process.env.MAILSLURP_PHONE_ID?.trim();
  if (!apiKey || !phoneId) throw new Error("Set MAILSLURP_API_KEY and MAILSLURP_PHONE_ID for npm run test:sms.");
  const response = await fetch(`https://api.mailslurp.com/phone/numbers/${phoneId}`, { headers: { "x-api-key": apiKey } });
  if (!response.ok) throw new Error(`MailSlurp number lookup failed: HTTP ${response.status}`);
  return (await response.json()).phoneNumber;
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0, // a retry would send another SMS
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "off", video: "off", screenshot: "off" },
  // Only the project being run is defined, so a plain `npx playwright test` stays local and offline.
  projects: realRun
    ? [{ name: "sms", testMatch: /real-sms\.spec\.ts/, timeout: 120_000 }]
    : [{ name: "local", testMatch: /local\.spec\.ts/ }],
  webServer: {
    command: "node app/server.mjs",
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
    env: realRun
      ? { SMS_PROVIDER: process.env.SMS_PROVIDER ?? "twilio", DEMO_USER_PHONE: await mailslurpNumber() }
      : { SMS_PROVIDER: "memory" },
  },
});
