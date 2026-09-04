# Model of the system

**You own this file.** Agents may propose a diff; they never write here directly.
Kept to two pages — when it outgrows that, the system has structure worth splitting.

## What this repo is

A near-default Angular CLI 9.1 scaffold. One root `AppComponent`, an empty
`AppRoutingModule` (`routes: Routes = []`), no business logic. New feature work is the
first real code.

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

- Gate scope (`karma.conf.js`, `angular.json` test/lint options, `tslint.json`,
  `tsconfig*.json`, `.ai/harness/verify.sh`) is changed by a human, never by an agent
  reaching for a better number.
- Nothing that matters lives only in a context window.

## Not yet true

No runtime oracle. `verify.sh deep` runs a build and reports
`RUNTIME: NOT CONFIGURED`; nothing in this repo currently proves the app boots.
Playwright is the intended fix, in its own session.

## Known drift

`docs/vibe-harness.html` is design v3 and predates the TriTrack review. It says six
doors, one flat verify, and budgets declared in frontmatter; the code has seven doors,
three verify tiers, and budgets enforced by a hook. Kept deliberately as a dated
snapshot until reconciled.
