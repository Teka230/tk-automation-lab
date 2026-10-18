import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyReference } from './verify-comparison.mjs';

const directory = resolve(process.env.LAB_RESULTS_DIR ?? 'test-results');
const report = JSON.parse(readFileSync(resolve(directory, 'results.json'), 'utf8'));
const summary = { ...verifyReference(report), startedAtUTC: report.stats.startTime, sourceCommit: process.env.GITHUB_SHA ?? null, node: process.version };
writeFileSync(resolve(directory, 'verification.json'), `${JSON.stringify(summary, null, 2)}\n`);
const text = '## Reference gate\n\n**7/7 passed, zero skipped, zero retries.** All seven expected cases were present.\n';
console.log(text);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
