# Model of the system

**You own this file.** Agents may propose a diff; they never write here directly.
Kept to two pages — when it outgrows that, the system has structure worth splitting.

## What this repo is

An Angular CLI 14.2 application (`mj-testing-playground`), upgraded from a v9
scaffold on 2026-09 (decision 0003). First real feature: vehicle brand/model
selection (decision 0004) - `VehicleService` (`src/app/vehicle/vehicle.service.ts`)
is the single owner of the selected brand and derives its models;
`BrandSelectComponent` and `ModelListComponent` are read-only consumers.
Toolchain: Jest, Playwright, ESLint, Storybook.

## Ownership of facts (one owner each)

| Fact | Owner |
|---|---|
| Build/test/lint commands, code conventions | `CLAUDE.md` |
| Structure and invariants of the system | this file |
| Why a specific change was made, and when | `.ai/decisions/` |
| A lesson that outlives this repo | `.ai/bank/` |

Nothing in `.ai/` restates a convention. If a fact appears in two places, one of them
is wrong and neither will tell you which.

## Invariants

- Gate scope (`jest.config.js`, `setup-jest.ts`, `playwright.config.ts`,
  `.eslintrc.json`, `angular.json`, `tsconfig*.json`, `.ai/harness/verify.sh`,
  `.claude/hooks/budget.mjs`) is changed by a human, never by an agent reaching for
  a better number.
- Nothing that matters lives only in a context window.

## Runtime oracle

`verify.sh deep` runs a production build, then `playwright test` — which boots the
app via its dev server and drives it in a real browser (`e2e/app.spec.ts`). A green
`deep` is the first genuinely runtime-verified state this repo has had. It does not
by itself cover every route or interaction added later; new features should extend
`e2e/` rather than relying on the one smoke spec.

## Known drift

None recorded.

## Known duplication

`.ai/harness/config.yml`'s `gate_scope_paths` and `.claude/hooks/budget.mjs`'s
`GATE_SCOPE` constant describe the same list from two places, because the hook has
no YAML parser and adding one would itself be a dependency change (door 1). Kept in
sync by hand; a drift between them would be silent. Worth fixing once a real need
for a YAML dependency exists elsewhere — not manufactured for this alone.
