# Comparison acceptance policy

The reference gate requires the seven named Chromium tests to pass once each. It rejects omissions, duplicates, renamed cases, other projects, skips, `test.fail`, retries, global errors and inconsistent summary counts.

The comparison runs the same seven tests. Four must pass. The other three must fail for the following specific reasons:

| Test | Required failure evidence | Classification |
| --- | --- | --- |
| Catalog contract | Positive numeric IDs attached, and assertion reports string expected / number received | Contract difference |
| GET/QUERY equivalence | Attached GET 200 and QUERY 405, and assertion reports 200 expected / 405 received | Capability difference |
| Price ascending | Attached finite, nonconstant descending prices, selected internal value `price,desc`, and ordering assertion failure | Known intentional functional defect |

The shared policy lives in `scripts/verify-comparison.mjs`. Inline diagnostic JSON is produced by the same test execution, not fetched from a second service or inferred from a failed test's name. HTML/JSON/JUnit are not rewritten.

`run-comparison.mjs` launches the canonical Playwright CLI with the current Node executable and both target URLs. It creates a new output directory, rejects an interrupted or unexpectedly successful process, requires a fresh JSON report and verifies every outcome. Missing reports, network errors, browser-launch errors and unexpected assertions cannot satisfy the policy. It writes `verification.json` only after successful verification; failures retain `verification-error.txt` and return a nonzero exit.

The campaign deliberately fails if the seeded defect disappears. That means the diagnostic baseline has changed and must be reviewed; it does not mean repairing Toolshop is undesirable. New API versions likewise require an explicit policy review rather than automatic acceptance.

The verifier has seventeen offline acceptance/rejection checks. These validate the campaign gate; the product suite remains seven tests. They do not prove hosted availability or runtime behavior.
