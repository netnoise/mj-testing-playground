# Patch notes — klaxon-regen-shell (door 7, human-applied)

`.ai/run/klaxon-regen-shell/patch/gate-scope.patch` is a unified diff of the 8 gate-scope files the regen changes. An agent
can't edit them (`.ai/HARNESS.md`, door 7). The rest of the regen is already committed on this
branch, which means **the branch is red until you apply this**: `angular.json` still describes
Angular 14 while `src/` and `package.json` describe Angular 21.

## Apply

Commit **before** verifying (`.ai/HARNESS.md`): applying is itself an undisclosed diff until it is
a commit. The files are pre-disclosed in `door-crossings.md`.

```bash
git apply .ai/run/klaxon-regen-shell/patch/gate-scope.patch
git add -A angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json setup-jest.ts eslint.config.js .eslintrc.json .claude/hooks/budget.mjs
git commit -m "chore(harness): apply the klaxon-regen-shell door-7 patch (Angular 21 gate config, flat ESLint, GATE_SCOPE)"
```

```bash
npm ci
```

```bash
bash .ai/harness/verify.sh deep
```

Then tell me the result and I'll write the digest and close the run.

## What is in the patch
| File | Change |
|---|---|
| `angular.json` | `@angular/build:application` builder; `outputPath` is `{ base: "dist/mj-testing-playground", browser: "" }` so `index.html` stays where `e2e/serve-dist.mjs` serves from; old production budgets kept (2mb/5mb initial, 6kb/10kb style); no `test` target and no `fileReplacements`; `lint` target from `ng add angular-eslint` |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` | Angular 21 generated (strict, ES2022, `module: preserve`); spec config keeps `jest` and `node` types |
| `setup-jest.ts` | `setupZonelessTestEnv()` from `jest-preset-angular/setup-env/zoneless` |
| `eslint.config.js` (new), `.eslintrc.json` (deleted) | Flat ESLint 9 config. The old rules are carried over: `app` selector prefixes, single quotes, semicolons, `no-console`, 140-char `max-len` (warn) |
| `.claude/hooks/budget.mjs` | `GATE_SCOPE` swaps `.eslintrc.json` for `eslint.config.js`. Must land in the same commit, or `verify.sh`'s preflight fails on a listed path that no longer exists |

Not in the patch, because unchanged: `jest.config.js` (byte-identical), `playwright.config.ts`,
`e2e/serve-dist.mjs`, `.ai/harness/verify.sh`, `.ai/harness/hook-test.sh`.

## Tested before handoff
In a scratch clone of this branch (session scratchpad, outside the repo, not kept), with this patch
applied on top of the branch's other changes:
- `npm run lint`: clean. `npx jest --ci`: 2 suites, 10 tests pass.
- `npm run build`: `dist/mj-testing-playground/index.html` present.
- `bash .ai/harness/verify.sh deep`: green (lint, jest, hook-test 23/23, build, both smoke routes).
- `rm -rf node_modules && npm ci` then `verify.sh full`: green, so the committed lockfile installs.
- The recorded V1–V4 patches against the ported validators spec: V1 caught (1 of 7 fail:
  `passwordMatchValidator › returns null when confirmPassword is empty`), V2, V3, V4 missed
  (7 of 7 pass). Same pattern as `.ai/run/old-baseline-findings/evidence.md`, validators-spec column.
- `git apply --check` against this repo's tree: clean.

## Not verified
- The real repo has not run `verify.sh` on the new tree: it can't until this is applied.
- `hook-test.sh` ran in the clone, where the hook's `gate-scope.json` regeneration is not exercised.
  After you apply, the first guarded tool call regenerates `.ai/harness/gate-scope.json`; check that
  its `missing` list is empty.
