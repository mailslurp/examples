import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
export default defineConfig({
  testDir: './test', testMatch: 'staging.spec.js', workers: 1, retries: 0, expect: {timeout: 25000},
  timeout: 300_000, reporter: 'line',
  use: { baseURL: 'http://localhost:3000', trace: 'off', screenshot: 'off', video: 'off' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: false }
});
