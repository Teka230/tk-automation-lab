import assert from 'node:assert/strict';
import { test } from 'node:test';
import { outcomes, verifyComparison, verifyReference } from './verify-comparison.mjs';

const attachment = (name, data) => ({ name, contentType: 'application/json', body: Buffer.from(JSON.stringify(data)).toString('base64') });
function fixture(comparison = true) {
  return {
    errors: [], config: { projects: [{ name: 'chromium', retries: 0 }] },
    stats: { expected: comparison ? 4 : 7, unexpected: comparison ? 3 : 0, skipped: 0, flaky: 0 },
    suites: [{ specs: outcomes.map(item => {
      const failure = comparison && item.failure;
      const result = { status: failure ? 'failed' : 'passed', retry: 0, errors: [], attachments: [] };
      if (failure === 'numeric-id-contract') {
        result.errors.push({ message: 'Expected: "string"\nReceived: "number"' });
        result.attachments.push(attachment('catalog-id-contract', { ids: [1, 2] }));
      } else if (failure === 'query-not-supported') {
        result.errors.push({ message: 'Expected: 200\nReceived: 405' });
        result.attachments.push(attachment('catalog-method-comparison', { getStatus: 200, queryStatus: 405 }));
      } else if (failure === 'known-price-sort-defect') {
        result.errors.push({ message: 'expect(received).toEqual(expected)' });
        result.attachments.push(attachment('price-order-observation', { displayedPrices: [30, 20, 10], selectedValue: 'price,desc' }));
      }
      return { ...item, tests: [{ projectName: 'chromium', expectedStatus: 'passed', results: [result] }] };
    }) }],
  };
}

test('accepts exactly the known three failures and preserves raw counts', () => {
  const result = verifyComparison(fixture());
  assert.equal(result.rawPassed, 4);
  assert.equal(result.rawFailed, 3);
});
test('reference requires all seven cases to pass', () => {
  assert.equal(verifyReference(fixture(false)).rawPassed, 7);
  assert.throws(() => verifyReference(fixture()));
});

const rejects = {
  'a missing case': r => r.suites[0].specs.pop(),
  'a renamed case': r => { r.suites[0].specs[0].title = 'other'; },
  'a duplicate case': r => { r.suites[0].specs[1] = structuredClone(r.suites[0].specs[0]); },
  'an extra unexpected failure': r => { r.suites[0].specs[1].tests[0].results[0].status = 'failed'; },
  'a disappeared expected failure': r => { r.suites[0].specs[6].tests[0].results[0].status = 'passed'; },
  'a skip': r => { r.suites[0].specs[1].tests[0].results[0].status = 'skipped'; },
  'test.fail masking': r => { r.suites[0].specs[0].tests[0].expectedStatus = 'failed'; },
  'enabled retries': r => { r.config.projects[0].retries = 1; },
  'a repeated attempt': r => r.suites[0].specs[0].tests[0].results.push(structuredClone(r.suites[0].specs[0].tests[0].results[0])),
  'an infrastructure error': r => r.errors.push({ message: 'browser unavailable' }),
  'wrong failure cause': r => { r.suites[0].specs[0].tests[0].results[0].errors[0].message = 'request timeout'; },
  'missing sorting observation': r => { r.suites[0].specs[6].tests[0].results[0].attachments = []; },
  'ascending prices presented as a detected defect': r => { r.suites[0].specs[6].tests[0].results[0].attachments = [attachment('price-order-observation', { displayedPrices: [10, 20, 30], selectedValue: 'price,desc' })]; },
  'non-finite/non-numeric prices': r => { r.suites[0].specs[6].tests[0].results[0].attachments = [attachment('price-order-observation', { displayedPrices: ['30', '20'], selectedValue: 'price,desc' })]; },
  'wrong QUERY status': r => { r.suites[0].specs[2].tests[0].results[0].attachments = [attachment('catalog-method-comparison', { getStatus: 200, queryStatus: 503 })]; },
};
for (const [name, mutate] of Object.entries(rejects)) {
  test(`comparison rejects ${name}`, () => {
    const report = fixture();
    mutate(report);
    assert.throws(() => verifyComparison(report));
  });
}
