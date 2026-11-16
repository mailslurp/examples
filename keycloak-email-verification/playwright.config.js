import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { defineConfig } from '@playwright/test';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.KC_HOME || !process.env.MAILSLURP_API_KEY) {
  throw new Error('Set KC_HOME and MAILSLURP_API_KEY before running the example.');
}
process.env.KC_BOOTSTRAP_ADMIN_USERNAME = 'example-admin';
process.env.KC_BOOTSTRAP_ADMIN_PASSWORD ||= randomBytes(32).toString('base64url');

export default defineConfig({
  testDir: './test', workers: 1, retries: 0, timeout: 180_000,
  expect: { timeout: 20_000 }, reporter: 'line',
  use: { baseURL: 'http://127.0.0.1:38761', actionTimeout: 20000, trace: 'off', video: 'off', screenshot: 'off' },
  webServer: {
    command: 'node start-keycloak.mjs',
    url: 'http://127.0.0.1:38761/realms/master/.well-known/openid-configuration',
    timeout: 150_000, reuseExistingServer: false
  }
});
