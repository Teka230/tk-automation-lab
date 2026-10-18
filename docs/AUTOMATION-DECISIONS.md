# Test automation strategy and decisions

## Objective

Produce verifiable evidence of automated test design, implementation, diagnosis and CI, not merely a green screenshot.

## Scope and risks

| Risk | Test level | Why |
| --- | --- | --- |
| Broken product data contracts | API | Fast, precise contract checks |
| Catalog links fail | UI | Real navigation must be validated in a browser |
| Search action fails after input | UI | Client state, interaction and backend response |
| Sort direction wrong | UI | End-user ordering (deliberately useful for buggy edition) |
| API/UI mismatch on product price or identity | Cross-layer | Shared business invariant across two surfaces |
| Different API methods return different catalog results | API | GET vs HTTP QUERY is an explicit SUT contract |

## Invariants

- A product ID identifies the same product and base price in catalog API, detail API and rendered detail page.
- Selecting the **user-facing** label “Price (Low - High)” must produce nondecreasing visible prices, regardless of the option's internal value.
- An API response must contain an array of coherent products, not just status 200.

## Authority and ownership

- **SUT** owns product and order data. Tests observe it, and the test repository owns only test code and evidence.
- The baseline API is the source of truth for UI↔API comparison, with the caveat that a correlated backend defect could fool both surfaces.
- GitHub CI owns the run result; the README cannot declare a PASS without run artifacts.

## Reliability decisions

- Selectors prioritize upstream `data-test` attributes verified in source over CSS layout or text-only locators.
- Playwright's auto-waiting assertions replace arbitrary sleeps.
- V0.1 avoids shared-data mutations. No cleanup or concurrent-state management is needed yet.
- Retries are **off** to surface instability. Report every failure, classify before declaring an application bug.
- Run browsers on Chromium first; expand after baseline repeatability is demonstrated.
- Public hosting remains an external dependency, hence this CI is **not fully deterministic** until the local isolated environment is deployed.

## Non-goals of V0.1

- No checkout, destructive API requests, auth session fixtures, database reset or seeding on shared public services.
- No inferred performance benchmark, flaky rate, or claims of regression detection before empirical runs.
- No visual snapshot suite: browser/platform differences require a controlled visual baseline.

## Verification gates

1. Exact SUT URL and version recorded; API/HTML reachable.
2. All tests pass at least once; attach report and commit SHA.
3. Repeat tests (e.g. ten clean runs), report successes and failures without hiding retries.
4. Reproduce a specific defect with baseline-vs-buggy evidence; do not confuse a different API contract with a bug.

## AUTOMATION-CI-1A

- The product suite stays at seven scenarios. Offline verifier checks are acceptance tests of CI classification, not additional SUT coverage.
- Reference results are blocking; the comparison runs on a fresh separate runner only after that gate passes.
- Explicit diagnostic attachments distinguish expected assertion failures from infrastructure errors. A known name or a red status alone cannot satisfy the policy.
- Raw reports remain authoritative and unmodified. A successful comparison job means known outcomes were verified, not that seven buggy-suite tests passed.
- Application routing belongs to the application: the cross-layer test follows its catalog link.
- Generated evidence is uploaded as artifacts. Documentation links executions and states the distinction between automated observations, independent human review and unverified assumptions.
