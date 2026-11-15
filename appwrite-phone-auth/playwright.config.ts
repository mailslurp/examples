import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

if (existsSync('.env')) process.loadEnvFile('.env');

// Only an explicit staging command can request a phone token from Appwrite.
const mode = process.argv.includes('--project=sms') ? 'sms'
  : process.argv.includes('--project=mock') ? 'mock' : 'local';
const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const project = process.env.VITE_APPWRITE_PROJECT_ID;
if (mode !== 'local' && (!endpoint || !project)) {
  throw new Error('Set the Appwrite staging endpoint and project ID in .env.');
}

export default defineConfig({
  testDir: './test',
  projects: [{ name: mode, testMatch: mode === 'local' ? 'local.spec.ts' : 'staging.spec.ts' }],
  timeout: 120_000,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off', screenshot: 'off', video: 'off',
  },
  webServer: {
    command: 'vite --host localhost --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    env: {
      VITE_APPWRITE_ENDPOINT: mode === 'local' ? 'http://localhost:4173/v1' : endpoint!,
      VITE_APPWRITE_PROJECT_ID: mode === 'local' ? 'local-fixture' : project!,
    },
  },
});
