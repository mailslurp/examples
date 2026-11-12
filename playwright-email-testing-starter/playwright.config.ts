import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  // Email delivery takes a few seconds; leave room for the wait plus the browser steps.
  timeout: 90_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // MailSlurp's public demo app. Replace with your own app's URL.
    baseURL: 'https://api.mailslurp.com/test-application/',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
