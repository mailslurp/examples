import { defineConfig } from 'cypress';
import { config } from 'dotenv';

config({ quiet: true });

export default defineConfig({
  // Email delivery takes a few seconds; give waits room before Cypress times out.
  defaultCommandTimeout: 30_000,
  requestTimeout: 30_000,
  responseTimeout: 30_000,
  env: {
    // read by the cypress-mailslurp plugin
    MAILSLURP_API_KEY: process.env.MAILSLURP_API_KEY,
  },
  e2e: {
    // MailSlurp's public demo app. Replace with your own app's URL.
    baseUrl: 'https://api.mailslurp.com/test-application/',
    supportFile: 'cypress/support/e2e.ts',
  },
});
