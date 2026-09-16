# HANDOFF - testing-techniques-docs
written by hand 2026-09-09 · reconciled to shipped reality 2026-09-16

## Status: DONE — this run is closed
Do not `/resume` this run to "finish" it; the docs shipped. See "Done" below.
A future session that wants to *act on* the roadmap starts a fresh run — the
Traps section still applies to that work.

## Goal
Document the testing techniques worth knowing beyond what this repo already
does, with an honest per-technique verdict, plus a phased roadmap for adopting
them. Docs only. See `brief.md` for the problem, `plan.md` for the spec.

## Done
Shipped and verified. (This section was originally, wrongly, "Nothing
implemented"; corrected 2026-09-16 — see `.ai/decisions/0005` "What actually
happened" for why the close-out was late.)

- `docs/testing-techniques.md`, `docs/testing-roadmap.md`, and the `README.md`
  pointer shipped in `672c27d`. `verify.sh full` passed (lint + 11 Jest specs);
  `check-citations.sh` resolved; diff stayed inside the declared radius.
- Bank card `.ai/bank/2026-09-09-silent-decisions.md` shipped in `42ed603`.
- Recorded in `.ai/decisions/0005-testing-techniques-docs.md`.

## In flight
Nothing. This run is closed.

## Next
Nothing for *this* run. The implementation work the roadmap describes
(`docs/testing-roadmap.md`, phases 0-6) is a separate future run with its own
brief, not a continuation of this one.

## Open decision
None outstanding for the docs. One item still to *raise*, not fixed here:
`README.md:3,19,23` still claims Angular CLI 9.1.0, Karma and Protractor - all
untrue since the v14 retool (`.ai/decisions/0003-angular-14-and-harness-retool.md`).
That is its own change; it was deliberately not ridden along on the docs commit.

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
