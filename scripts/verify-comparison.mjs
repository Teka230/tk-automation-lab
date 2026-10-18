import assert from 'node:assert/strict';
import { basename } from 'node:path';

// Reference contracts stay strict. This campaign classifies known outcomes;
// it never converts the three raw Playwright failures into passing tests.
export const outcomes = [
  { file: 'api.spec.ts', title: 'catalog returns paginated, usable product data', failure: 'numeric-id-contract' },
  { file: 'api.spec.ts', title: 'item detail resolves to the same identity and price as the catalog' },
  { file: 'api.spec.ts', title: 'GET and HTTP QUERY return equivalent catalog results for the same criteria', failure: 'query-not-supported' },
  { file: 'cross-layer.spec.ts', title: 'UI ↔ API: product identity and base price remain consistent' },
  { file: 'ui.spec.ts', title: 'catalog renders product cards and navigates to the selected product' },
  { file: 'ui.spec.ts', title: '@regression search displays the searched term and matching results' },
  { file: 'ui.spec.ts', title: '@regression price ascending sort is respected by the visible catalog', failure: 'known-price-sort-defect' },
];

const key = ({ file, title }) => `${basename(file)}::${title}`;
const flatten = suites => suites.flatMap(s => [...(s.specs ?? []), ...flatten(s.suites ?? [])]);
const stripANSI = text => text.replace(/\u001b\[[0-9;]*m/g, '');

function observation(result, name) {
  const matches = result.attachments.filter(a => a.name === name && a.contentType === 'application/json');
  assert.equal(matches.length, 1, `Exactly one ${name} attachment required`);
  assert.equal(typeof matches[0].body, 'string', `${name} must be inline JSON`);
  return JSON.parse(Buffer.from(matches[0].body, 'base64').toString('utf8'));
}

function casesFor(report) {
  assert.deepEqual(report.errors, [], 'Global errors invalidate the campaign');
  assert.equal(report.config.projects.length, 1, 'One Chromium project required');
  assert.equal(report.config.projects[0].name, 'chromium');
  assert.equal(report.config.projects[0].retries, 0, 'Retries must be disabled');
  const specs = flatten(report.suites);
  assert.equal(specs.length, outcomes.length, 'Exactly seven product tests required');
  assert.equal(new Set(specs.map(key)).size, outcomes.length, 'Duplicate tests are forbidden');
  const actual = new Map(specs.map(spec => [key(spec), spec]));
  return outcomes.map(expected => {
    const spec = actual.get(key(expected));
    assert.ok(spec, `Missing expected case: ${key(expected)}`);
    assert.equal(spec.tests.length, 1, 'Multiple projects/repeats are forbidden');
    const test = spec.tests[0];
    assert.equal(test.projectName, 'chromium');
    assert.equal(test.expectedStatus, 'passed', 'test.fail/skip must not hide outcomes');
    assert.equal(test.results.length, 1, 'Exactly one attempt required');
    const result = test.results[0];
    assert.equal(result.retry, 0, 'Retries are forbidden');
    return { expected, result };
  });
}

export function verifyReference(report) {
  const checks = casesFor(report).map(({ expected, result }) => {
    assert.equal(result.status, 'passed', `Reference case must pass: ${key(expected)}`);
    assert.equal((result.errors ?? []).length, 0);
    return { file: expected.file, title: expected.title, status: result.status };
  });
  assert.equal(report.stats.expected, 7);
  assert.equal(report.stats.unexpected, 0);
  assert.equal(report.stats.skipped, 0);
  assert.equal(report.stats.flaky, 0);
  return { verdict: 'reference-passed', rawPassed: 7, rawFailed: 0, retries: 0, checks };
}

export function verifyComparison(report) {
  const checks = casesFor(report).map(({ expected, result }) => {
    assert.equal(result.status, expected.failure ? 'failed' : 'passed', `Unexpected outcome: ${key(expected)}`);
    assert.equal((result.errors ?? []).length, expected.failure ? 1 : 0, 'Unexpected errors');
    const message = stripANSI(result.errors?.[0]?.message ?? '');
    if (expected.failure === 'numeric-id-contract') {
      const data = observation(result, 'catalog-id-contract');
      assert.ok(Array.isArray(data.ids) && data.ids.length > 0);
      assert.ok(data.ids.every(id => Number.isSafeInteger(id) && id > 0), 'Expected numeric positive IDs');
      assert.match(message, /Expected:\s*"string"\s+Received:\s*"number"/, 'Wrong failure cause for ID contract');
    } else if (expected.failure === 'query-not-supported') {
      assert.deepEqual(observation(result, 'catalog-method-comparison'), { getStatus: 200, queryStatus: 405 });
      assert.match(message, /Expected:\s*200\s+Received:\s*405/, 'Wrong failure cause for QUERY');
    } else if (expected.failure === 'known-price-sort-defect') {
      const data = observation(result, 'price-order-observation');
      const prices = data.displayedPrices;
      assert.ok(Array.isArray(prices) && prices.length > 1 && prices.every(Number.isFinite));
      assert.equal(data.selectedValue, 'price,desc', 'Known reversed label mapping has changed');
      assert.deepEqual(prices, [...prices].sort((a, b) => b - a), 'Known fault must display descending prices');
      assert.notDeepEqual(prices, [...prices].sort((a, b) => a - b), 'Ascending/equal prices do not prove the defect');
      assert.match(message, /toEqual/, 'Wrong failure cause for price order');
    }
    return { file: expected.file, title: expected.title, status: result.status, classification: expected.failure ?? 'passed' };
  });
  assert.equal(report.stats.expected, 4);
  assert.equal(report.stats.unexpected, 3);
  assert.equal(report.stats.skipped, 0);
  assert.equal(report.stats.flaky, 0);
  return { verdict: 'expected-outcomes-confirmed', rawPassed: 4, rawFailed: 3, knownFunctionalDefects: 1, contractDifferences: 2, retries: 0, checks };
}
