# The scaffold is Angular 14 and the Klaxon milestone can't start until a modern, green shell exists
run: klaxon-regen-shell · intake 2026-09-18

## Intent
Replace the Angular 14.3 scaffold with an Angular 21.2 LTS shell that passes `verify.sh deep`,
carrying over only the validators (ported) and the production-build deep gate. **No board yet.**
The old app stays reachable at the local tag `scaffold-ng14` (`3932df7`).

> "plan for klaxon mileston 1" — decision 0008 §5 steps 1 (regen) of the milestone-1 sequence.

## Done when
- [ ] `bash .ai/harness/verify.sh deep` is green on the new tree, run **after** the door-7 patch is
      applied and committed by a human.
- [ ] Angular is pinned to 21.2.x, TypeScript 5.9.x, Jest 30, jest-preset-angular 17, ESLint 9
      with a flat `eslint.config.js`; Storybook and Compodoc are removed from `package.json`.
- [ ] The ported validators spec reproduces the recorded V1–V4 catch/miss pattern, by running
      `.ai/run/old-baseline-findings/mutations/V{1,2,3,4}.patch` against it (V1 caught by the
      validators spec; V2, V3, V4 missed). A different pattern means the port changed what the
      tests can see: stop and report.
- [ ] `dist/mj-testing-playground/index.html` exists after `npm run build`
      (`outputPath` `{ base, browser: "" }`), so `e2e/serve-dist.mjs`, `verify.sh` and
      `playwright.config.ts`'s `webServer` need no edit.
- [ ] `src/app/smoke-routes.spec.ts` and `e2e/smoke-routes.ts` are ported and `smoke` is green.
- [ ] The only tests removed from the old suite are the four named under Doors (door 4, amended by
      `/understand`: was three); `git diff --name-status scaffold-ng14 -- '*.spec.ts'` shows the three
      deleted files and nothing else removed, and `e2e/smoke.spec.ts` loses only its last test.
- [ ] `CLAUDE.md`'s Project, Commands and Tooling sections describe the new stack, and
      `eslint.config.js` is listed in `GATE_SCOPE`.

## Out of scope
- No board, no incident fixture, no new screens, no advanced-form component (only its validators).
- No Storybook, no Compodoc, no Vitest, no `@angular/build:unit-test` target.
- No change to `e2e/serve-dist.mjs`, `verify.sh` or `hook-test.sh` beyond what a door-7 patch
  strictly needs; if `verify.sh` needs an edit, say why in the patch notes.
- No push, no tag push, no merge to `master`.

## Doors
All three are crossed by design and were approved with the plan; state them anyway so the run
records them.
- **1 (dependencies):** Angular 21.2, TS 5.9, Jest 30, jest-preset-angular 17, ESLint 9 +
  angular-eslint 21, remove Storybook/Compodoc, add `@testing-library/dom` (used from run 2).
  Default: approved. Cost if wrong: redo run 1.
- **4 (deleting tests):** `src/app/advanced-form/advanced-form.component.spec.ts`,
  `src/app/app.component.spec.ts`, `e2e/app.spec.ts`, deleted with the components they test, **and**
  the last test in `e2e/smoke.spec.ts` (`a plain (non-forced, non-evaluate) click reaches the submit
  button`), which drives `/advanced-form`'s Submit button and can't survive the component.
  *(The fourth was added by `/understand`; see Understand.)* Default: approved; the old suite is at
  `scaffold-ng14`.
- **7 (gate scope):** `angular.json`, `tsconfig*.json`, `jest.config.js`, `setup-jest.ts`,
  `playwright.config.ts` (only if `webServer` needs it; expected: no), `.eslintrc.json` deleted
  and replaced by `eslint.config.js`, and `.claude/hooks/budget.mjs`'s `GATE_SCOPE`.
  An agent can't edit these. Default: stage them under `.ai/run/klaxon-regen-shell/patch/` and
  hand the human a unified diff. The human applies it, **commits, then** verifies.

## Open decisions
None. Two assumptions, cheap to change:
- Angular 21's generated names (`app.ts`, class `App`, no `.component` suffix) are kept, because
  `ng generate` produces them and `CLAUDE.md` says generate, don't hand-build. `CLAUDE.md`'s
  selector-prefix rules are unaffected.
- The base is `master` at `3932df7`, which now contains `claude/old-baseline-findings` (merged
  locally, not pushed) and so the V1–V4 patches this run needs. The old scaffold is tagged
  `scaffold-ng14` (local tag, same commit as the merge; pushing it is door 6, yours).

## Understand
Feasibility was checked in the session scratchpad, outside the repo, before writing this brief
(the scratch project is not kept; commands are enough to redo it):

- `npx @angular/cli@21.2 new feas --style=scss --routing --skip-git --defaults --ssr=false
  --test-runner=vitest` generates `@angular/build:application`, TS ~5.9.2, `jsdom ^28`, no
  zone.js (zoneless by default), files `app.ts`, `app.html`, `app.scss`, `app.config.ts`,
  `app.routes.ts`.
- `npm i -D jest@30 jest-preset-angular@17 @types/jest@30 jest-environment-jsdom@30` plus
  `setupZonelessTestEnv()` from `jest-preset-angular/setup-env/zoneless` runs the generated
  component spec and an rxjs `timer` spec under `jest.useFakeTimers()`: 2 suites, 3 tests pass
  in 1.1s on Node v24.11.1. So the risk the plan named (zoneless + Jest) did not materialise.
- Setting `outputPath` to `{ "base": "dist/mj-testing-playground", "browser": "" }` puts
  `index.html` directly in `dist/mj-testing-playground/`, which is where `e2e/serve-dist.mjs`
  serves from.
- `ng add angular-eslint` adds the `lint` target and an `eslint.config.js`
  (flat, ESLint 9, `angular.configs.templateAccessibility` included); `ng lint` passes on the
  generated app. The old rules (single quotes, semi, `max-len` 140, `no-console`) must be added.
- Angular 22 needs Node ≥24.15 (`npm view @angular/cli@22 engines`), here 24.11.1, so it is out.

Read in `/understand`:

- **A fourth test dies with the component.** `e2e/smoke.spec.ts:50` drives
  `/advanced-form`'s Submit button. The intake brief listed three deletions. The component goes,
  so this test goes or is repointed; `/understand` defaults to deleting it (see Open decisions).
- **The routing pair ports mechanically if a route with a path stays.**
  `src/app/smoke-routes.spec.ts:25` asserts at least one declared path and imports `routes` from
  `./app-routing.module` (`:1`); `e2e/smoke-routes.ts:14` lists `['/', '/advanced-form']`. The old
  routes are `advanced-form` plus a `''` redirect (`src/app/app-routing.module.ts:13-14`).
- **Only four tests need their timing harness converted.** `fakeAsync`/`tick` appear in
  `src/app/advanced-form/advanced-form.validators.spec.ts:35-61`, four tests, each one
  `runUsernameCheck(...)`, `tick(delayMs)`, one assertion. The `passwordMatchValidator` tests
  (`:19-29`) are synchronous.
- **Door-7 list, exactly.** `.claude/hooks/budget.mjs:86-89` is the array. `hit()` matches
  `tsconfig*.json` at the repo root only (`.ai/harness/lib.mjs:34-39`: the wildcard branch
  anchors on the whole path with `[^/]*`), so `.storybook/tsconfig.json` is **not** gate scope and
  can be deleted by the agent.
- **Deleting `.eslintrc.json` without updating `GATE_SCOPE` turns `verify.sh` red.**
  `.ai/harness/verify.sh:24-29` fails the preflight when a listed pattern resolves to nothing. So
  the patch must land as one commit: delete `.eslintrc.json`, add `eslint.config.js`, and swap the
  name in `GATE_SCOPE`.
- **Every gate-scope file the patch touches is an "undisclosed crossing" until disclosed.** The
  hook's sweep and `verify.sh`'s preflight compare the tree with the run's `base_commit`
  (`.ai/HARNESS.md`, Budgets). The run therefore writes `door-crossings.md` naming those files
  **before** the human applies the patch, and the digest must mention it (`close-run.sh` enforces).
- **`hook-test.sh` needs no edit.** It builds its own fixture `angular.json` in a temp repo
  (`.ai/harness/hook-test.sh:55`), and nothing in it names `.eslintrc.json`.
- **`verify.sh` needs no edit.** It calls `npm run lint` (`.ai/harness/verify.sh:80`) and
  `npx jest --ci` (`:83`); both stay as npm scripts.
- **What leaves `src/`:** `main.ts` (NgModule bootstrap), `polyfills.ts`, `environments/`,
  `app.module.ts`, `app-routing.module.ts`, `advanced-form/*` except the validators, `assets/`,
  `favicon.ico` (Angular 21 uses `public/`), and `src/app/app.component.stories.ts`. `.storybook/`
  goes with Storybook (three tracked files). The old `angular.json` has `fileReplacements`
  (`angular.json:37`), the new one has none, so `CLAUDE.md`'s `environment.prod.ts` line goes too.
- **Consequence for Done-when box 3.** Only the validators spec is ported, so V1–V4 can only be
  compared on the `validators.spec` column of `.ai/run/old-baseline-findings/evidence.md`. The
  component-spec and `app.spec.ts` columns of that table can't be reproduced after the deletions,
  and this run doesn't claim to.
- **No bank entry applies** (`.ai/bank/` has citation-drift and silent-decisions only).
  `.ai/decisions/0003-angular-14-and-harness-retool.md` is the prior retool; nothing in it
  contradicts this plan.

## Hypothesis
Serves Done-when boxes 1–5. The ported validators spec, with `fakeAsync`/`tick` replaced by Jest
fake timers and nothing else changed, gives the same catch/miss pattern as the recorded V1–V4.

Falsified if: any of V2, V3, V4 is caught, or V1 is missed, by the ported spec; or
`verify.sh deep` cannot go green without editing `serve-dist.mjs`.

## Model of the system
*(human-owned — my best guess, correct it in one edit)*
The agent can't touch the gate config, so the work splits in two. Everything outside gate scope
(`src/`, `e2e/`, `package.json`, `CLAUDE.md`, `.storybook/`) is edited in the repo as normal.
Everything inside it is built in a **scratch clone** (outside the repo, in the session
scratchpad), where the full new tree can actually be built, linted, tested and served, then
exported as one unified diff for you to apply and commit. That way the patch is known to work
before you see it, which is the shape `harness-v43-critical` used. Only the final `verify.sh
deep` in the real repo, after you apply and commit, counts.

## Blast radius
- `src/**` (deletions and the new app; the old `src/app/*` files go)
- `e2e/smoke.spec.ts` (last test removed only)
- `e2e/smoke-routes.ts`
- `package.json`
- `package-lock.json`
- `.storybook/**`
- `CLAUDE.md`

Not listed on purpose: `angular.json`, `tsconfig*.json`, `jest.config.js`, `setup-jest.ts`,
`.eslintrc.json`, `eslint.config.js`, `.claude/hooks/budget.mjs` (door 7, patch only), and
`e2e/app.spec.ts` and the three deleted specs (they are deleted via `git rm` in the human's
commit or by the agent under the door-4 approval; either way they are recorded, not silent).
This is a `redesign`-sized diff. Suggested `open-run.sh`: type `redesign`, 40 files, 90 minutes.

## Doors
As stated above (1, 4, 7), plus one process door worth naming:
- **6 (outside the repo):** the scratch clone lives in the session scratchpad, which is the
  sanctioned temp location, and nothing in it is pushed or kept. Default: use it. Cost if wrong:
  none; the alternative is an untested patch.

## Open decisions
One. What happens to `e2e/smoke.spec.ts:50`, the click-reaches-Submit test?
- **Default: delete it in this run** (door 4, listed above). Its own comment says it exists
  because a dev-server overlay swallowed clicks and `deep` now serves the production build;
  run 2's board spec makes a real `click()` its main path, so the property is tested again where a
  button exists. Cost if wrong: a window between runs 1 and 2 where no test performs a real click.
- Alternative: keep the advanced-form component alive only to give it a button. Rejected: it keeps
  the whole NgModule form in a codebase whose point is to replace it.
