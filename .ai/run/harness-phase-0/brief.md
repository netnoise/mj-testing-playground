# Scaffold the vibe harness (Phase 0 + 1)
run: harness-phase-0 · started 2026-09-04

## Understand
- Repo is a near-default `ng new` scaffold: `src/app/app.component.ts:1`,
  empty `routes` at `src/app/app-routing.module.ts:8`.
- Conventions already have an owner: `CLAUDE.md:21` documents sass/selectors/tslint.
- Gate scope lives in `angular.json:83` (test) and `angular.json:100` (lint),
  plus `karma.conf.js:1` and `tslint.json:1`.
- The only spec is `src/app/app.component.spec.ts:20`, whose first assertion is
  `expect(app).toBeTruthy()` — the vacuous shape the TriTrack review names.

## Model of the system  ← human-owned
No domain model yet. The harness is the first real content in this repo.

## Hypothesis
A harness made of plain markdown plus four small scripts gives unattended runs that
survive interruption, without adding a dependency or a framework.
Falsified if: any part needs a package installed, or the durability path needs a
model call to work.

## Blast radius
New: `.ai/**`, `.claude/**`, `docs/vibe-harness.html`, `AGENTS.md`.
Appended: `CLAUDE.md`, `README.md`. No file under `src/` or `e2e/` is touched.

## Doors
None crossed. No dependency, migration, external contract, deleted test, auth path,
or gate-scope config edited.

## Open decisions
Resolved before start: runtime tier = Playwright, deferred to a dedicated session;
first target = this repo. Both answered by the human on 2026-09-04.
