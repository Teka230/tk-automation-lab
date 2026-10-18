import { defineConfig, devices } from '@playwright/test';
import { isolatedSutTargets } from './src/local-sut-guard.mjs';

// Fail closed at config load: never mutate a hosted SUT by accident.
const { web } = isolatedSutTargets();

export default defineConfig({
  testDir: './tests-isolated',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/isolated' }],
    ['json', { outputFile: 'test-results/isolated/results.json' }],
    ['junit', { outputFile: 'test-results/isolated/junit.xml' }],
  ],
  outputDir: 'test-results/isolated/artifacts',
  use: {
    baseURL: web,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: { mode: 'only-on-failure', fullPage: true },
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [{ name: 'isolated-chromium', use: { ...devices['Desktop Chrome'] } }],
});
