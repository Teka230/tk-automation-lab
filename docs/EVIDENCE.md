# Execution evidence

## Source recovery for AUTOMATION-CI-1A

On 2026-10-18 the prior Desktop checkout became unreadable iCloud `dataless` placeholders. It was preserved. A separate checkout was prepared from the supplied ZIP and the previous corrections.

The reconstructed eight-file source/dependency/workflow snapshot exactly matched the SHA-256 recorded at the end of the previous local qualification:

```text
c42f6381b55bc1d837592d51933838a8211f11f0f689e987b1b46a05a34df3af
```

The new CI tranche then added diagnostic API attachments, explicit outcome verifiers, their offline checks and separate reference/comparison jobs. Its evidence is re-executed against this checkout; earlier inaccessible reports are not represented as new CI artifacts.

## Current qualification

The first hosted execution completed successfully; its exact source commit and artifacts are recorded below. The two acceptance criteria are independent:

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

## First hosted run on 2026-10-18

[GitHub Actions run 39129143394](https://github.com/Teka230/tk-automation-lab/actions/runs/39129143394) — event `push`, source commit [`28f2a1e`](https://github.com/Teka230/tk-automation-lab/commit/28f2a1e2d4be447378eb284992ab1c8475ea5700). Both jobs succeeded on separate fresh Ubuntu 24.04 runners.

| Job | Raw passed | Raw failed | Acceptance |
| --- | ---: | ---: | --- |
| Reference gate | 7 | 0 | All seven named tests present; zero skips/retries |
| Known-fault comparison | 4 | 3 | Exact sorting fault and two API differences verified |

Both jobs successfully installed Node 22.23.3, ran npm ci, and installed Chromium plus system dependencies. The reference job also passed all seventeen offline verifier checks.

Both artifact archives were downloaded and inspected: HTML, JSON, JUnit and verification metadata are readable; the comparison includes traces, a full-page screenshot and video. JUnit still records three comparison failures. Source commits embedded in both verification files match the tested commit. [Structured summary](evidence/ci1a-first-run.json).

Artifacts are retained for 30 days (this run's artifacts expire on 2026-11-17). Use a new workflow dispatch to regenerate evidence after expiry. These documentation changes do not alter the tested suite; the run remains attributed to its exact source commit.

Main branch protection requires an up-to-date PR with both checks from GitHub Actions, including for administrators. Approving reviews are not required; automated checks are not presented as human review.
