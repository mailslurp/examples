import { defineConfig } from "@playwright/test";

const port = Number(process.env.PORT ?? 4310);
const realRun = process.argv.some((arg) => arg === "--project=sms" || arg === "sms");

//<gen>sms_otp_playwright_config
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0, // a retry would send another SMS
  reporter: [["list"]],
  use: { trace: "off", video: "off", screenshot: "off" },
  // Only the project being run is defined, so a plain `npx playwright test` stays local and offline.
  projects: realRun
    ? [{ name: "sms", testMatch: /playground-sms\.spec\.ts/, timeout: 120_000, use: { baseURL: "https://playground-sms.mailslurp.com" } }]
    : [{ name: "local", testMatch: /local\.spec\.ts/, use: { baseURL: `http://127.0.0.1:${port}` } }],
  // The local suite starts the demo app with a simulated SMS sender; the real run uses the playground.
  webServer: realRun
    ? undefined
    : { command: "node app/server.mjs", url: `http://127.0.0.1:${port}/`, reuseExistingServer: false, env: { SMS_PROVIDER: "memory" } },
});
//</gen>
