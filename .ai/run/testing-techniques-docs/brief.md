# The repo is a "testing playground" that demonstrates three testing techniques
run: testing-techniques-docs · started 2026-09-09

## Understand
- The repo exercises example-based unit tests, one happy-path e2e spec, and two
  static stories. Nothing documents what *else* exists or why it was skipped.
- `src/app/app.component.spec.ts:24` is `expect(app).toBeTruthy()` — vacuous,
  and `.ai/prompts/test.md` already names this exact line as its counter-example.
- `src/app/vehicle/vehicle.service.ts:18` is `(brand && BRAND_MODELS[brand]) || []`.
  Indexing a `Record<string, …>` by arbitrary string is unchecked: `tsconfig.json:26-28`
  enables `strictInjectionParameters`/`strictInputAccessModifiers`/`strictTemplates`
  but **not** `strict` or `noUncheckedIndexedAccess`. Best fuzz/property target here.
- `src/app/vehicle/vehicle.service.ts:15` derives `brands` from `Object.keys`, so
  brand order is an undeclared dependency on object key order.
- `src/app/vehicle/brand-select.component.ts:16` coerces `value || null`; the
  empty-string→null reset path has no spec.
- `package.json:46` has `@storybook/addon-interactions` installed, but no story
  defines a `play()` function anywhere. Installed, paid for, unused.
- `playwright.config.ts:14` declares exactly one project, `chromium`
  (`playwright.config.ts:16`) — no viewport or cross-browser matrix.
- There is no CI: the repo has no `.github/` directory at all. Visual-regression
  baselines and mutation scores are near-worthless local-only, which forces the
  ordering of any adoption plan.
- `.claude/hooks/budget.mjs:43` defines door 7's `GATE_SCOPE` — every test-config
  file is human-approval-gated, so tooling adoption is never a casual edit.

## Model of the system  ← human-owned
This is a demonstration repo: the app exists to have something to test, not the
reverse. So a technique's value here is partly *pedagogical* — showing what a
technique looks like — and not only defect-catching. There are no HTTP calls
anywhere in `src/`, and nothing is deployed. (correct me if wrong)

## Hypothesis
Two Markdown documents — a comprehensive technique catalog with a per-entry
verdict, and a phased roadmap sequenced by real prerequisites — capture the
decision durably without touching a single gate-scope file.
Falsified if: the catalog cannot state an honest verdict for an entry without
first running the tool (i.e. the doc is really a spike in disguise). Then that
entry becomes a roadmap phase, not a catalog claim.

## Blast radius
- `docs/testing-techniques.md` (new)
- `docs/testing-roadmap.md` (new)
- `README.md` (pointer only, in the existing docs list)
- `.ai/run/testing-techniques-docs/**`

## Doors
None for this run — docs only. No dependency, no config, no test weakened.
The *roadmap* documents future crossings rather than making them: door 1 for
Stryker, `fast-check`, `@axe-core/playwright`; door 7 for any edit to
`playwright.config.ts` or `jest.config.js`. Listing them per phase is the point,
so a human can approve them in batch instead of meeting them mid-run.

## Open decisions
None. Format (Markdown in `docs/`), scope (comprehensive, including
not-applicable entries), and split (docs now, implementation later) were all
settled with the human before this brief was written.
