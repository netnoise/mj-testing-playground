# Evidence — old baseline, e2e layer and advanced-form validators

- **Baseline commit:** `32e5dc6` (master, 2026-09-18). Run branch `claude/old-baseline-findings`;
  the mutated tree differed from `eaed381` only by the patch in question (`src/` and `e2e/` are
  byte-identical between the two).
- **Predictions:** `predictions.md`, committed at `eaed381` before any mutation was run.
- **Test revision:** every `*.spec.ts` and `e2e/*.spec.ts` as of `32e5dc6`, frozen, not edited.
- **Commands:** jest cells `npx jest <spec> --ci`; e2e cells `npm run build` then
  `HARNESS_DEEP=1 npx playwright test <spec> --reporter=list` (production build served by
  `e2e/serve-dist.mjs`). Not `verify.sh deep`: it stops at lint/jest, so it would hide the e2e
  result for any mutation jest catches.
- **Environment:** local macOS (Darwin 25.5.0 arm64), Node v24.11.1, Jest 28.1.3, Playwright 1.30.0
  (chromium).
- **Scenario/seed:** n/a (no data, no randomness; each cell ran once).
- **Raw output:** `mutations/output/<cell>.<layer>.<spec>.txt`. Patches: `mutations/*.patch`.
  Outcomes: `.ai/run/old-baseline-findings/mutations/results.tsv`. Replay: `sh mutations/replay.sh` (reproduced all 24
  outcomes a second time).
- **Restored:** `git diff --stat -- src e2e` is empty after every revert
  (`.ai/run/old-baseline-findings/mutations/restored-diffstat.txt`), and the full e2e suite is green on the clean tree
  (`.ai/run/old-baseline-findings/mutations/output/restored.e2e.txt`, 6 passed, exit=0).

## Results

`caught` = the spec file failed, `missed` = it passed. Status vocabulary from 0008 §2.

| # | Mutation | validators.spec | component.spec | e2e `app.spec.ts` | e2e `smoke.spec.ts` |
|---|---|---|---|---|---|
| 0 | none (baseline) | — | — | pass | pass |
| M1 | `<h1>` → `<div class="title">` | not run | not run | **caught** | missed |
| M2 | `.app-header` renamed in scss only | not run | not run | **missed** | missed |
| M3 | `.app-header` renamed in template + scss | not run | not run | **caught** | missed |
| V1 | delete `\|\| !confirmPassword.value` (`src/app/advanced-form/advanced-form.validators.ts:11`) | **caught** | **missed** | missed | missed |
| V2 | case-insensitive password compare (`:14`) | missed | missed | missed | missed |
| V3 | drop `'angular'` from the taken list (`:6`) | missed | missed | missed | missed |
| V4 | `timer(delayMs)` → `timer(0)` (`:22`) | missed | missed | missed | missed |

(`not run` for M1–M3 in jest: the app-shell mutations don't touch validators; their jest result is
the recorded one in `.ai/run/klaxon-claims-correction/evidence.md`. `n/a` would also be honest:
the validator specs never render `AppComponent`.)

## What this shows

- **All 24 predictions matched.** That is a result about how predictable these specs are, not
  evidence the predictions were careful. Three of the four validator mutations are misses at every
  layer, and I predicted that from reading the specs, which is the cheaper way of getting the same
  answer. The value of running them is that the misses are now *recorded* rather than predicted.
- **The e2e layer shares the jest layer's coupling on M1–M3.** M1 and M3 both fail the same
  test with the same message (`toHaveText`, expected `"mj-testing-playground"`, received
  `undefined`, after a 5s timeout), so the e2e failure cannot tell the heading demotion from a
  harmless class rename either. M2 is missed, as at the jest layer. The "same locator, same
  outcome" guess written in `.ai/run/klaxon-claims-correction/evidence.md` ("Not run") is now measured:
  it holds. Note the e2e failure costs a 5s timeout where jest crashes instantly.
- **`smoke.spec.ts` missed every mutation**, including the demoted heading. That is by design
  (it asserts nothing about content), and is worth stating because it means the cheap `smoke` tier
  provides no protection against any mutation in this table.
- **What the misses describe is the inputs the specs feed, not Jest or Playwright.**
  - V3: the specs only ever try `admin` as a taken name, so the other three list entries are
    unobserved.
  - V2: no spec feeds two passwords that differ only in case.
  - V1: the empty-confirm behaviour is pinned by exactly one spec, `src/app/advanced-form/advanced-form.validators.spec.ts:19`, and
    the component spec never reaches it.
  - V4: no spec asserts that the check waits for its configured delay, so nothing distinguishes
    `timer(0)`.

## Caveats and what is not established

- **V4 may be observable only by a test that is not written yet**, and I have not ruled out that
  it is an equivalent mutant at the level of these specs' contract. It is recorded as missed, not
  as "a real defect nobody tests".
- **Each cell ran once.** No flake check. The replay reproduces every outcome a second time, which
  is weak evidence against flakiness, not proof of stability.
- **e2e per-file granularity only.** `results.tsv` records a spec file as pass or fail. The
  per-test detail (for M1 and M3, only `should display the app shell…` fails; the other two pass)
  is in the raw output, not in the table.
- **`e2e/app.spec.ts:39` clicks through `evaluate`, not a real pointer**, so the submit test does
  not exercise a real click. Not touched here (out of scope).
- **Nothing was fixed.** No new test, no spec edit. An improved test is a later iteration row.
