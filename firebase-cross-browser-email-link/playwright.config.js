import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const baseURL = 'http://localhost:4193';
export default defineConfig({
  testDir: './test', workers: 1, timeout: 130000, retries: 0, reporter: 'line',
  use: { baseURL, trace: 'off', video: 'off', screenshot: 'off' },
  webServer: { command: 'npm run dev', url: baseURL, reuseExistingServer: false, timeout: 90000 }
});
