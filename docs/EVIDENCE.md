# Execution evidence

## Source recovery for AUTOMATION-CI-1A

On 2026-10-18 the prior Desktop checkout became unreadable iCloud `dataless` placeholders. It was preserved. A separate checkout was prepared from the supplied ZIP and the previous corrections.

The reconstructed eight-file source/dependency/workflow snapshot exactly matched the SHA-256 recorded at the end of the previous local qualification:

```text
c42f6381b55bc1d837592d51933838a8211f11f0f689e987b1b46a05a34df3af
```

The new CI tranche then added diagnostic API attachments, explicit outcome verifiers, their offline checks and separate reference/comparison jobs. Its evidence is re-executed against this checkout; earlier inaccessible reports are not represented as new CI artifacts.

## Current qualification

Local and hosted CI execution links, exact commits and observed counts are recorded here after execution. The two acceptance criteria are independent:

1. Reference: all seven product tests pass with zero skipped/retried tests.
2. Comparison: raw result is four passed / three failed; the exact known causes are verified, including the sorting defect. Any deviation fails the campaign.

Generated HTML/JSON/JUnit, screenshots, video and traces are CI artifacts, not committed files. The application deployment SHAs and shared data remain uncontrolled. No statistical stability claim is made.

### Local CI-1A qualification

- Node v22.23.3, Playwright 1.56.1, Chromium 141.0.7390.37, macOS arm64.
- Fresh dependency installation using npm ci; local Chromium cache reused.
- Reference 2026-10-18T12:51:06.230Z: 7 passed / 0 failed; reference verifier accepted.
- Comparison 2026-10-18T12:52:01.945Z: 4 passed / 3 failed; exact-outcome verifier accepted.
- Seventeen offline verifier checks passed. No retries or skipped product tests.
- Current-source fingerprint and file hashes: [local summary](evidence/local-ci1a.json).
- This local execution is distinct from the fresh hosted runners still to be observed.
