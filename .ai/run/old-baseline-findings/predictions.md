# Predictions — written and committed before any mutation is run

- **Baseline commit:** `32e5dc6` (master, 2026-09-18); the run's `base_commit` in `state.json`.
- **Rule (0008 §2):** these are hypotheses. A result that differs is recorded as a difference
  and this file is never edited afterwards; corrections go in `evidence.md`.
- **Layers:** `jest` = `npx jest` on the named spec file. `e2e` = `bash .ai/harness/verify.sh
  deep` (production build, `e2e/app.spec.ts` and `e2e/smoke.spec.ts`).
- Per-test predictions for e2e name the test in `e2e/app.spec.ts` by its title.

## e2e layer, existing founding patches

| # | Mutation (patch from `.ai/run/klaxon-claims-correction/mutations/`) | Predicted | Why |
|---|---|---|---|
| M1 | `<h1>` → `<div class="title">` | `app.spec.ts` "should display the app shell…" **caught**; the other two pass | `.app-header h1` locator at `e2e/app.spec.ts:5` matches nothing |
| M2 | `.app-header` renamed in scss only | **missed** (all pass) | DOM unchanged; no assertion looks at styles |
| M3 | `app-header` renamed in template and scss | "should display the app shell…" **caught**; same failure as M1 | the locator is a `.app-header` class selector |

`smoke.spec.ts` is predicted to pass all three (it asserts nothing about content).

## Validator mutations (new)

| # | Mutation | validators.spec | component.spec | e2e |
|---|---|---|---|---|
| V1 | delete `|| !confirmPassword.value` from the guard (`advanced-form.validators.ts:11`) | **caught** (`:19` "returns null when confirmPassword is empty") | **missed** (no test feeds a password with an empty confirm) | **missed** |
| V2 | compare passwords case-insensitively (`:14`) | **missed** | **missed** | **missed** |
| V3 | drop `'angular'` from `TAKEN_USERNAMES` (`:6`) | **missed** (only `admin` is tried) | **missed** | **missed** |
| V4 | `timer(delayMs)` → `timer(0)` (`:22`) | **missed** (`tick(delayMs)` still satisfies it) | **missed** | **missed** |

Confidence: high on M1, M3, V1 (validators.spec) and V2, V3; medium on M2 and V4. The lowest
confidence is on V1's component.spec cell, which I have not searched exhaustively for a test that
feeds a filled password and an empty confirm.

## What a wrong prediction would mean
A predicted miss that turns out caught means a spec reaches further than its titles say. A
predicted catch that turns out missed means the test does not assert what its title claims. Both
are findings about the specs, not about Jest or Playwright.
