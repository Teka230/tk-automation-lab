import { defineConfig, devices } from '@playwright/test';

const webURL = process.env.SUT_WEB_URL ?? 'https://practicesoftwaretesting.com';
const resultsDir = process.env.LAB_RESULTS_DIR ?? 'test-results';
const reportDir = process.env.LAB_REPORT_DIR ?? 'playwright-report';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0, // Re-runs must not hide instability in the initial evidence.
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: reportDir }],
    ['json', { outputFile: `${resultsDir}/results.json` }],
    ['junit', { outputFile: `${resultsDir}/junit.xml` }],
  ],
  outputDir: `${resultsDir}/artifacts`,
  use: {
    baseURL: webURL,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: { mode: 'only-on-failure', fullPage: true },
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
