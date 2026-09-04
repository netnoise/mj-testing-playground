# 0003 — Merge Angular 14, retool the harness

## Problem
`origin/master` shipped a full Angular 9 → 14 toolchain upgrade
(Karma → Jest, Protractor → Playwright, tslint → ESLint) while this branch
was mid-build on the harness. The user's own `verify.sh` run on their Mac
broke immediately (`Cannot find builder "@angular-devkit/build-angular:tslint"`),
and every gate-scope reference in the harness (`karma.conf.js`, `tslint.json`)
pointed at files that no longer existed.

## Root cause
The harness's doors, gates, and citations were written against the v9
toolchain and had no way to know it had moved.

## Decision
Merge master, then retool door 7's gate-scope list, `verify.sh`'s three
tiers, `config.yml`, `HARNESS.md`, and `MODEL.md` for Jest/Playwright/ESLint.
Playwright becomes `deep`'s real runtime oracle — the thing Playwright was
originally deferred to its own session to provide arrived as a side effect
of an unrelated dependency upgrade.

## Why
The alternative — reverting or ignoring master's upgrade — would have kept
the harness working against a toolchain the actual repo no longer uses,
which is a worse failure than any amount of retooling effort.

## Trade-off
`.ai/harness/config.yml`'s `gate_scope_paths` and `.claude/hooks/budget.mjs`'s
`GATE_SCOPE` constant now duplicate the same list, because the hook has no
YAML parser and adding one would itself be door 1. Accepted rather than
fixed, since fixing it means adding a dependency for a repo that currently
has zero YAML-parsing needs elsewhere.

## Concept
**A door list is a snapshot of the toolchain it was written against.**
Nothing about "the config that defines a gate's own scope" changes when the
toolchain changes — but the specific file paths do, silently, and a citation
checker can confirm a path resolves without ever confirming it's still the
*right* path for the intent behind it.

## What actually happened
`npm ci` failed with "Missing: typescript@5.9.3 from lock file" — not
anything from this merge, but an incomplete lockfile already committed to
master: `@compodoc/compodoc` was missing the nested `typescript` entry its
sibling `@compodoc/ngd-core` already had. `package-lock.json` is explicitly
named in this harness's own door-1 list. Door 1 isn't hook-enforced, so per
`HARNESS.md`'s own rule for an unenforced door, the crossing was stated and
logged (`.ai/run/harness-v14-retool/door-crossings.md`) rather than blocked
on. Verified before trusting it: `package.json` untouched, no dependency's
declared range changed, the only added lockfile entry was the missing
nested one.

Once repaired, `verify.sh deep` went green in-container for the first time
in this repo's history: lint, Jest, a production build, and Playwright
actually booting the dev server and driving the app in real Chromium.
EOF
sh .ai/harness/check-citations.sh .ai/decisions/0003-angular-14-and-harness-retool.md