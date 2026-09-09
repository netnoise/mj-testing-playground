# HANDOFF - testing-techniques-docs
written by hand 2026-09-09 - planning session, no implementation

## Goal
Document the testing techniques worth knowing beyond what this repo already
does, with an honest per-technique verdict, plus a phased roadmap for adopting
them. Docs only. See `brief.md` for the problem, `plan.md` for the spec.

## Done
Nothing implemented. Planning and verification of the ground truth only:

- Repo state mapped: what each test layer covers and where the gaps are.
- Every `file:line` in `brief.md` verified by direct read on 2026-09-09.
- Format, scope and split settled with the human (Markdown in `docs/`;
  comprehensive catalog including not-applicable entries; docs now,
  implementation later).

## In flight
Nothing. Clean tree apart from this run directory.

## Next
1. Write `docs/testing-techniques.md` to the entry skeleton in `plan.md`.
   Six sections, ~33 entries, one verdict each, closing index table.
2. Write `docs/testing-roadmap.md`, phases 0-6 plus the deferred set. Every
   phase names its doors.
3. Add both to the README's docs list (pointer only, 3-4 lines).
4. Verify per `plan.md` - `verify.sh fast`, `git diff --stat`,
   `check-citations.sh`, then the manual read.

## Open decision
None outstanding for the docs. One item to *raise*, not fix: `README.md:3,19,23`
still claims Angular CLI 9.1.0, Karma and Protractor - all untrue since the v14
retool (`.ai/decisions/0003-angular-14-and-harness-retool.md`). That is its own
change; do not ride it along on a docs commit.

## Traps
- **`state.json` is `"paused"` with `"started_at": null`.** Both are deliberate.
  `.claude/settings.json:21`'s Stop hook fires `handoff.sh` on any run whose
  status is `"active"`, and `.claude/hooks/budget.mjs:79` compares `started_at`
  against a 45-minute budget. Flipping status to `"active"` while leaving the
  old timestamp would blow the budget on the very first edit. Set **both**
  together when you start.
- **Door 7 is live** (`.claude/hooks/budget.mjs:43`). `jest.config.js`,
  `setup-jest.ts`, `playwright.config.ts`, `.eslintrc.json`, `angular.json`,
  `tsconfig*.json`, `verify.sh` and the hook itself are all blocked without
  `HARNESS_DOOR_OPEN=1` and a human's say-so. This run needs none of them - if
  you find yourself reaching for one, you have left the plan.
- **One owner per fact.** Do not restate build/test commands (`CLAUDE.md`) or
  testing doctrine (`.ai/prompts/test.md`) in the new docs. Cite them.
- **Citations drift.** `brief.md`'s line numbers were correct on 2026-09-09; a
  later edit to those sources silently invalidates them and
  `check-citations.sh` will still pass if the line merely *resolves*. Resolution
  is not aptness - see `.ai/bank/2026-09-04-citation-drift.md`.
- The catalog's honesty depends on the "not applicable" entries staying that
  way. There are no HTTP calls anywhere in `src/` and nothing is deployed;
  don't let contract testing or chaos engineering creep into "adopt now".

## Resume
```
git checkout claude/testing-techniques-review-go6osk && /resume testing-techniques-docs
```

> A clean exit is not evidence of work. Diff the tree before believing
> anything above.
