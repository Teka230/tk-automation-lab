# AUTOMATION-2A — local-only cart automation

## Purpose and scope

The public **seven-test reference gate** and the **seven-test known-fault comparison** remain unchanged. This first 2A slice adds **three distinct product tests** behind an opt-in configuration which is never invoked by GitHub Actions. No changes to the workflow or baseline verification scripts.

Source of truth: GitHub `Teka230/tk-automation-lab`, `main`; work on a feature branch / PR. Cursor's local `.cursor/rules/source-of-truth.mdc` is deliberately untouched.

## Local setup

The upstream SUT is [testsmith-io/practice-software-testing](https://github.com/testsmith-io/practice-software-testing) sprint 5. Obtain it **in another directory** and run its Docker setup. Its README documents `SPRINT=sprint5` in upstream `.env`, `docker compose up -d`, UI on port 4200 and API on port 8091. Ensure both are healthy and data is seeded.

Upstream license applies: do not redistribute or publicly host its application. These tests are for a private local instance.

```bash
npm ci
npx playwright install chromium
npm run check:isolated
LOCAL_SUT_MUTATION_ACK=LOCAL_ONLY npm run test:isolated
```

Optional: override `LOCAL_SUT_WEB_URL` and `LOCAL_SUT_API_URL`, but both must be root HTTP loopback URLs. Default addresses are `http://127.0.0.1:4200` and `http://127.0.0.1:8091`. The opt-in is mandatory even to load the isolated configuration.

The guard disallows non-loopback hosts and HTTPS, but **cannot detect a local proxy forwarding traffic to a public service**. Never forward these ports to a hosted Toolshop. These tests write data. They are **not** suitable for shared/public CI SUTs.

## Three new checks

| Case | Layer | Expected result | Cleanup |
| --- | --- | --- | --- |
| Add / update / remove | API | Quantity transitions 0 → 2 → 3 → 0 | Fixture deletes its own cart ID |
| Zero quantity | API negative | HTTP 422, cart stays empty | Fixture deletes its own cart ID |
| Product page → cart | UI + API | User click creates a cart with product quantity 1 | Test deletes observed session cart ID |

All data-reading tests choose an in-stock, non-rental product on the seeded local catalog's first page, avoiding the SUT's special Thor Hammer constraint. No products, customers, or orders are created. No blanket DB refresh, sleep or retry.

Cleanup failure **fails** the relevant test. There is one known black-box limit: if the UI creates a cart but never writes its ID into session storage, that orphan cannot be identified for teardown. Run on a dedicated disposable SUT; reseeding is an explicit local operator action, never test automation.

## Acceptance

1. Run the offline guard test and observe 13/13 PASS.
2. Record upstream SUT revision and independently verify local UI/API readiness.
3. Run isolated Playwright and obtain **3/3 PASS with zero skips and retries**.
4. Inspect HTML / JUnit / JSON plus failure attachments if applicable.
5. Repeat ten independent runs before claiming stability. Record actual counts.
6. Verify cleanup failure is surfaced in a separate controlled local experiment.

## Evidence / status

- 2026-10-18: verified upstream route/controller contracts for `POST /carts`, `POST /carts/{id}`, `PUT /carts/{id}/product/quantity`, `GET /carts/{id}`, DELETE endpoints, 422 validation and `[data-test="add-to-cart"]` in upstream source.
- Offline guard tests: **13/13 PASS**.
- Local Toolshop sprint5: three isolated scenarios executed on `e1c5644` (JSON `Accept` headers required for Laravel 422 vs misleading 302→404).
- **STABILITY-1** on `e1c5644`: **10/10 runs, 30/30 PASS, 0 retries, 0 skips**; reference gate still **7/7**. See `docs/EVIDENCE.md` and `docs/evidence/stability-1-verdict.json`.
- Existing GitHub Actions remain authoritative for the previous 7/7 + 4/7 hosted evidence only; isolated suite stays opt-in / local-only.
