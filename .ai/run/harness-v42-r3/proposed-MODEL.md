# Model of the system

**You own this file.** Agents may propose a diff; they never write here directly.
Kept to two pages — when it outgrows that, the system has structure worth splitting.

## What this repo is

An Angular CLI 14.2 application (`mj-testing-playground`), upgraded from a v9
scaffold on 2026-09 (decision 0003). Current surface: a minimal app shell
(`AppComponent` — header + `router-outlet`) routing to `AdvancedFormComponent`
(decision 0005), a reactive-forms showcase — validation, async availability
check, a full submit flow. Vehicle brand/model selection (decision 0004) was
built, then deleted outright by decision 0005 rather than routed in; it is
gone, not archived. Component styles: SCSS. Toolchain: Jest, Playwright, ESLint,
Storybook.

## Ownership of facts (one owner each)

| Fact | Owner |
|---|---|
| Build/test/lint commands, code conventions | `CLAUDE.md` |
| Structure and invariants of the system | this file |
| Why a specific change was made, and when | `.ai/decisions/` |
| A lesson that outlives this repo | `.ai/bank/` |
| Human-owed fixes and bank cards with an unbuilt mechanism | `.ai/harness/OWED.md` |

Nothing in `.ai/` restates a convention. If a fact appears in two places, one of them
is wrong and neither will tell you which.

## Invariants

- Gate scope is changed by a human, never by an agent reaching for a better
  number. `.claude/hooks/budget.mjs`'s `GATE_SCOPE` array is the sole owner and
  enforcer; it emits the live list to `.ai/harness/gate-scope.json` on every
  invocation, so nothing else needs to hand-keep a copy.
- `state.json` is single-writer: created once by `/understand`, never edited by
  any other tool call while a run is active.
- Nothing that matters lives only in a context window.

## Runtime oracle

`verify.sh smoke` and `deep` both build the app and serve the actual production
output (`e2e/serve-dist.mjs`, not `ng serve`) — a dev server can be a leftover
process of unknown provenance, which is what produced a wrong "all tests pass"
report once (decision 0005 / the `ui-shell-redesign` retro). `smoke` is a
generic route-mount check (both routes, no uncaught error, no console error,
no horizontal overflow) meant to run inside the fix loop; `deep` adds the
feature-driving spec (`e2e/app.spec.ts`) and stays reserved for hand-back. New
features should extend `e2e/` rather than relying on the existing specs alone.

## Known drift

None currently known. This file itself was the most recent instance: it
described `VehicleService`/`BrandSelectComponent`/`ModelListComponent` as the
current feature for a full phase after decision 0005 deleted them, undetected
because `check-citations.sh` only resolved `path:line` citations, not a bare
path. Fixed alongside the checker itself
(`docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md`, workstream R3).

## Known duplication

None currently known. The door-7 gate-scope list previously existed as six
independent hand-kept copies (this file, `.ai/HARNESS.md`, `.ai/harness/config.yml`,
`.claude/hooks/budget.mjs`, and both design docs), one of which — the
cheatsheet — had already silently dropped an entry. Resolved: `budget.mjs` is
now the sole owner, emitting `.ai/harness/gate-scope.json`; everything else
reads that file rather than keeping its own list.
