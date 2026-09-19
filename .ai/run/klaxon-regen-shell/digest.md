## Klaxon regen shell: Angular 14 → 21.2   claude/klaxon-regen-shell · verify deep ✓ · ~33m wall clock, most of it waiting on the patch · 34 files (+8 gate-scope files you applied)

### One decision for you
The brief said ESLint 9; the tree has **ESLint 10** (`^10.3.0`, lock 10.11.0), because `ng add angular-eslint` in the scratch clone bumped it and every gate passed on it there and here. **Default: keep it**, and `CLAUDE.md` and the patch notes now say 10. **Cost if wrong:** a downgrade means touching `package.json` and the lockfile again and re-verifying. **Reversible:** yes, one dependency line.

### What surprised me
ESLint 10 dropped the old `.eslintrc` mode entirely, so while `.eslintrc.json` still existed next to a new `node_modules` the editor's ESLint integration failed with a wall of "removed option" errors. The failure looked like a broken new config but was the old config meeting the new install. The gate-scope preflight was right to insist that deleting `.eslintrc.json` and swapping `GATE_SCOPE` land in one commit.

### What I learned about your system
- **Keeping the build output path avoided three edits.** `e2e/serve-dist.mjs:26` hardcodes `dist/mj-testing-playground`, and Angular 21's application builder would write `dist/<name>/browser`. Setting `outputPath` to `{ base, browser: "" }` in `angular.json` kept `serve-dist.mjs`, `verify.sh` and `playwright.config.ts` untouched.
- **Zoneless needs no zone.js, and the ported spec proves the timing swap changed nothing observable.** `src/app/advanced-form/advanced-form.validators.spec.ts:34` uses Jest fake timers where `fakeAsync`/`tick` were. The recorded V1–V4 mutations gave the same pattern on it: V1 caught, V2–V4 missed.
- **The smoke tier is now the only e2e.** `e2e/smoke.spec.ts:29` loops over the routes in `e2e/smoke-routes.ts`, and after deleting the old `app.spec.ts` nothing feature-driving remains until run 2 adds a board e2e spec. `deep` currently proves "every route mounts", not "the app does something".

### Concept: verify where the change can be tested, hand over only what can't
The door-7 files were built and checked in a scratch clone, then exported as one patch (`.ai/run/klaxon-regen-shell/patch/gate-scope.patch`). The human's step shrank to apply, commit, `npm ci`. It recurs in `harness-v43-critical`'s patch flow and in `.ai/HARNESS.md`'s door 7 guidance to propose a diff, not a full-file replacement.

### What I did — and what is NOT verified
- Opened a `redesign` run on a branch from `master` (`3932df7`, which now includes the old-baseline merge and the `scaffold-ng14` tag).
- Committed everything outside gate scope (`8d09540`); you applied the door-7 patch as `7c1a21a`.
- Added seven npm aliases for the harness scripts (`b8a439c`).
- `verify.sh deep` is green on this branch after your apply, with `gate-scope.json`'s `missing` list empty and `.eslintrc.json` gone.
- **Not verified:** the editor's ESLint integration (I can't run it); `npm run serve:dist`; a stability re-run of the V1–V4 check (once).
- **Not done, deliberately:** no board, no `@testing-library/dom` (deferred to run 2, where it's first used), no Storybook or Compodoc.
- **Stale and left alone:** comments in `e2e/smoke.spec.ts` and `.ai/harness/verify.sh` still mention the deleted e2e `app.spec.ts`; run 2 restores a feature-driving spec.
- **Unexplained:** `package-lock.json` has an uncommitted one-line `"peer": true` change I didn't make.

### What I widened or crossed
- **Door 7 (crossed):** `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `setup-jest.ts`, `.eslintrc.json` (deleted), `eslint.config.js` (new) and `.claude/hooks/budget.mjs` (`GATE_SCOPE`), disclosed in `.ai/run/klaxon-regen-shell/door-crossings.md` before the patch was applied. `jest.config.js` and `playwright.config.ts` were disclosed early but did not change.
- **Door 1 (crossed, approved with the plan):** Angular 14 → 21.2, TypeScript 5.9, Jest 30, jest-preset-angular 17, ESLint 10 and angular-eslint 21; Storybook and Compodoc removed.
- **Door 4 (crossed, approved with the plan):** `app.spec.ts` (e2e), `advanced-form.component.spec.ts` and `app.component.spec.ts` deleted, plus the last test in `e2e/smoke.spec.ts`. The fourth was added by `/understand`, not the intake brief.
- **Allowlist:** the e2e `app.spec.ts` was added at open time so its deletion was an allowed edit, not a Bash bypass. No `revise-run.sh` revisions were recorded.

### What I got wrong
- I stopped at the door with a status note and no runnable commands or question. You lost a round trip and it looked as if the patch had been applied when it hadn't. I now put commands inline and end a blocked turn with a question.
- I told you ESLint 9 without checking what `ng add` had done to `package.json`.
- I pre-disclosed two files that never changed, and my first `smoke.spec.ts` cut dropped a closing brace. The second I caught and fixed before anything ran on it.
- My memory-note write was blocked by the run allowlist, so your "ask when blocked" preference is not saved yet; do it after closing.
