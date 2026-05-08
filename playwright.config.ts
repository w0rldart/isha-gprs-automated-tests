import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseURL = process.env.TARGET_BASE_URL;

if (!baseURL) {
  throw new Error('Missing required env var: TARGET_BASE_URL');
}

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],
  use: {
    baseURL,
    headless: !process.env.PWDEBUG,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    viewport: { width: 1440, height: 1200 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
});
