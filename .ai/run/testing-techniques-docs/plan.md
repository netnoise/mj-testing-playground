# Plan — testing techniques catalog and roadmap

The deliverable spec. `brief.md` holds the problem and hypothesis; this holds
what to actually write. Nothing here has been implemented yet.

## Deliverable 1 — `docs/testing-techniques.md`

A comprehensive reference. Fixed per-entry skeleton so it stays scannable and
extensible:

```
### <Technique>
**What it is** — one or two sentences, no jargon left undefined.
**Where it's used** — concrete real-world grounding (org, tool, or practice).
**Fit here** — verdict grounded in this repo, citing file:line where relevant.
**Cost** — dependencies, doors crossed, CI prerequisite.
**Verdict** — Adopt now · Adopt after <prereq> · Not applicable until <trigger>
```

Six sections, ~33 entries. **Every entry gets a verdict, including an honest
"not applicable"** — that is the difference between a catalog and a wish list.

1. **Test-suite quality and correctness** — mutation testing, property-based
   testing, snapshot testing, golden master/approval testing, differential
   testing, metamorphic testing, model-based testing, combinatorial/pairwise
   testing, fuzzing, changed-lines coverage gating.
2. **Component and UI layer** — Storybook interaction tests (`play()`), visual
   regression, accessibility (axe), cross-browser/viewport matrix, user-centric
   queries (testing-library style).
3. **Integration and contract** — consumer-driven contract testing (Pact), API
   schema validation, record/replay (VCR), service virtualization (MSW). All
   four are *not applicable until a real API exists* — there are no HTTP calls
   anywhere in `src/`. State the trigger, don't recommend them.
4. **Production and delivery** — canary/progressive delivery and feature flags,
   shadow traffic/dark launch, chaos engineering, synthetic monitoring,
   observability-driven testing, A/B experimentation. *Not applicable until
   deployed*; say what each would require.
5. **Performance** — load/stress testing, frontend performance budgets (note
   that `angular.json` **already** enforces bundle budgets — this is a real
   perf gate the repo owns and should be named as such), Lighthouse CI.
6. **Process and scale** — flaky test detection and quarantine, test impact
   analysis, exploratory testing charters, bug bars/release readiness, security
   scanning (SAST/DAST/dependency), LLM-assisted test generation.

Opening section frames why the taxonomy matters: each technique answers a
different question — "is my suite meaningful?", "did the UI shift?", "does it
survive the real world?". Closing table indexes every entry by verdict so the
decisions can be scanned without reading the prose.

**Do not restate** build/test commands (owned by `CLAUDE.md`) or testing
doctrine — failing-spec-first, invariant-per-`it()`, changed-lines coverage,
`vacuous: N` — which is owned by `.ai/prompts/test.md`. Cite, never duplicate.
One owner per fact.

## Deliverable 2 — `docs/testing-roadmap.md`

Phased, sequenced by dependency rather than by appeal. Each phase states:
scope · files touched · doors crossed · verification · exit criteria.

- **Phase 0 — Close the free gaps.** No dependencies, no doors. Strengthen the
  existing specs (exact-brands assertion instead of `arrayContaining`; the
  `selectBrand(null)` reset path; Honda and Ford, never asserted today; replace
  the vacuous `toBeTruthy`). Add `play()` interaction tests using the already
  installed `@storybook/addon-interactions` (`package.json:46`). Add the missing
  `brand-select` story and a `moduleMetadata` override so `ModelListComponent`
  can render a populated state, not only `Empty`.
  Files: `src/**/*.spec.ts`, `src/**/*.stories.ts`. Verify: `verify.sh full`.
- **Phase 1 — CI.** `.github/workflows/` running `verify.sh` per tier. Not door
  7 (`.github/**` is outside `GATE_SCOPE`). **Prerequisite for phases 2 and 4**
  and for the flaky-detection entry.
- **Phase 2 — Visual regression.** Playwright's built-in `toHaveScreenshot()`;
  zero new dependencies. Baselines committed, CI runs them. Door 7 *only* if
  thresholds or `snapshotPathTemplate` require touching `playwright.config.ts`
  — confirm at implementation time; the assertion itself works unconfigured.
- **Phase 3 — Accessibility.** `@axe-core/playwright` (door 1) wired into the
  existing e2e specs.
- **Phase 4 — Mutation testing.** Stryker + `@stryker-mutator/jest-runner`
  (door 1; `stryker.conf.json` is a new file, so **not** door 7). The honest
  audit of whether Phase 0's specs assert behaviour or merely execute lines.
- **Phase 5 — Property-based testing.** `fast-check` (door 1) against
  `VehicleService` invariants — the unchecked index at
  `src/app/vehicle/vehicle.service.ts:18` is the natural first property.
- **Phase 6 — Playground showcase.** Techniques whose value here is
  demonstrative rather than protective: metamorphic (the cold `models$` pipe at
  `src/app/vehicle/vehicle.service.ts:17`), model-based (the null → brand → null state
  machine; note there is no `distinctUntilChanged`, so re-selecting the same
  brand re-emits), differential, approval testing. This is where a repo named
  "testing playground" earns the name.
- **Deferred, with triggers.** Everything in catalog sections 3 and 4, each with
  the condition that would activate it.

## Deliverable 3 — `README.md` pointer

Add both documents to the README's existing docs list, three or four lines.
`README.md` is not gate scope.

Separately flag to the human, do **not** silently fix: the README is stale —
it claims Angular CLI 9.1.0, Karma, and Protractor, none of which are true
since the v14 retool (`.ai/decisions/0003-angular-14-and-harness-retool.md`).
That is its own change, not a rider on a docs commit.

## Out of scope

No edits to `jest.config.js`, `setup-jest.ts`, `playwright.config.ts`,
`.eslintrc.json`, `angular.json`, `tsconfig*.json`, `.ai/harness/verify.sh`, or
`.claude/hooks/budget.mjs`. No dependency additions. No new specs or stories.
No `.ai/MODEL.md` edit. The roadmap *describes* those changes; it does not make
them.

## Verification

Documentation has no test suite, so verification is structural:

1. `bash .ai/harness/verify.sh fast` — no-regression check (docs sit outside the
   lint scope, so this proves only that no source file was touched by accident).
2. `git diff --stat` — must show only the two new `docs/` files, `README.md`,
   and `.ai/run/testing-techniques-docs/**`. Any other path means the change
   escaped its declared radius.
3. `bash .ai/harness/check-citations.sh` — every `file:line` in the run docs
   must resolve. Note the citations in `brief.md` were verified by direct read
   on 2026-09-09; a later edit to those source files will drift them (see
   `.ai/bank/2026-09-04-citation-drift.md`).
4. Manual read: no `CLAUDE.md` command restated, no `.ai/prompts/test.md`
   doctrine re-argued, every catalog entry carries one of the three verdict
   forms, and the closing index table matches the entries above it.
5. Every roadmap phase names its doors. A phase that adds a dependency without
   a door-1 label is an error.
