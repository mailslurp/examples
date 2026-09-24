import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 180_000, retries: 0, workers: 1,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: { ...devices['Desktop Chrome'], headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: process.env.AI_SMOKE_LOCAL_APP === 'true' ? {
    command: 'node fixture/server.mjs',
    wait: { stdout: /AI fixture ready (?<app_url>http:\/\/localhost:\d+)/ },
    timeout: 15_000,
  } : undefined,
});
