import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: process.env.MINI_ZAPIER_E2E_BASE_URL ?? 'http://127.0.0.1:5179',
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
});
