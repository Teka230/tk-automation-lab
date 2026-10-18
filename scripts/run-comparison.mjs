import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyComparison } from './verify-comparison.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const id = `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`;
const resultsDir = resolve(root, process.env.LAB_RESULTS_DIR ?? 'test-results/comparison', id);
const reportDir = resolve(root, process.env.LAB_REPORT_DIR ?? 'playwright-report/comparison', id);
mkdirSync(resultsDir, { recursive: true });
const webURL = process.env.COMPARISON_WEB_URL ?? 'https://with-bugs.practicesoftwaretesting.com';
const apiURL = process.env.COMPARISON_API_URL ?? 'https://api-with-bugs.practicesoftwaretesting.com';
assert.equal(Boolean(process.env.COMPARISON_WEB_URL), Boolean(process.env.COMPARISON_API_URL), 'Override both comparison URLs together');
const startedAt = Date.now();
const child = spawnSync(process.execPath, [require.resolve('@playwright/test/cli'), 'test'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, SUT_WEB_URL: webURL, SUT_API_URL: apiURL, LAB_RESULTS_DIR: resultsDir, LAB_REPORT_DIR: reportDir },
});

try {
  assert.ifError(child.error);
  assert.equal(child.signal, null, 'Interrupted test process');
  assert.equal(child.status, 1, 'The known-fault suite must return exit code 1');
  const reportFile = resolve(resultsDir, 'results.json');
  const report = JSON.parse(readFileSync(reportFile, 'utf8'));
  const reportTime = Date.parse(report.stats.startTime);
  assert.ok(Number.isFinite(reportTime) && reportTime >= startedAt - 5000 && reportTime <= Date.now(), 'Missing or stale report timestamp');
  const summary = {
    ...verifyComparison(report),
    startedAtUTC: report.stats.startTime,
    sourceCommit: process.env.GITHUB_SHA ?? null,
    node: process.version,
    playwright: require('@playwright/test/package.json').version,
    webURL, apiURL, reportFile, htmlReport: reportDir,
  };
  writeFileSync(resolve(resultsDir, 'verification.json'), `${JSON.stringify(summary, null, 2)}\n`);
  const lines = [
    '## Known-fault comparison',
    '',
    'Campaign verified: **4 passed, 3 expected raw failures, zero retries**.',
    '',
    '| Outcome | Classification |',
    '| --- | --- |',
    '| Numeric product IDs | Contract difference |',
    '| QUERY returns 405 | Contract difference |',
    '| Ascending label displays descending prices | Known functional defect detected |',
    '',
    'Every case, attempt, observation and failure cause matched the policy. Raw JSON/JUnit retain all three failures.',
  ].join('\n');
  console.log(`\n${lines}\n\nReport: ${reportDir}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines}\n`);
} catch (error) {
  writeFileSync(resolve(resultsDir, 'verification-error.txt'), `${error.stack}\n`);
  console.error('Comparison rejected:', error.message);
  process.exitCode = 1;
}
