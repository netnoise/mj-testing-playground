# journal — ui-shell-redesign

21:42 brief      ✓ brief.md + state.json written, no doors crossed yet
22:0x scope       ✓ user resolved both open decisions in chat: drop
                  vehicle-selection entirely; SASS → SCSS. Brief rewritten to
                  match; door 1 closed (no UI kit), door 7 and door 4 opened
                  with the user's chat message as explicit say-so
22:1x branch      ✓ created local branch `redesign/ui-shell` off
                  `feat/advanced-form` (already pushed to origin) rather than
                  committing further onto the shared branch directly
22:1x delete      ✓ `git rm -r src/app/vehicle` — service, both components,
                  specs, stories; removed from `app.module.ts` declarations
22:1x shell       ✓ `app.component.html` rewritten: deleted the entire `ng new`
                  scaffold (toolbar/cards/terminal/footer) and the hardcoded
                  vehicle section; now a minimal header + `router-outlet`
22:1x scss        ✓ `app.component.sass` and `advanced-form.component.sass`
                  converted to `.scss` (brace syntax) and deleted; `styleUrls`
                  updated. `src/styles.scss` created alongside the untouched
                  `src/styles.sass`
22:1x !           angular.json edit (schematics default + global stylesheet
                  path) blocked by the harness's own door-7 hook, as expected
                  — logged in brief.md, left for the human, not worked around
22:2x tests        ✓ `app.component.spec.ts` rewritten (no vehicle imports,
                  asserts the new header); `e2e/app.spec.ts` rewritten (drops
                  the scaffold-text and vehicle-flow assertions, adds shell +
                  advanced-form validation + full-submit coverage)
22:2x !           `verify.sh full` surfaced two issues that predate this run
                  entirely (confirmed via `git stash` against
                  `feat/advanced-form@907ffdb` before touching anything):
                  (1) `advanced-form.component.spec.ts` didn't compile —
                  16x `TS4111` from unbracketed `.errors.x` reads; (2) a
                  stray, already-pushed `git worktree` at
                  `.claude/worktrees/xenodochial-banzai-617355` gets swept
                  into `jest --ci` because `jest.config.js` only excludes
                  `/node_modules/` and `/e2e/`. (1) is fixed here (bracket
                  notation + `jest.spyOn` instead of Jasmine's `spyOn(...)
                  .and.callThrough()` — also pre-existing, same file) since it
                  directly blocks a green gate; (2) is untouched
                  (`jest.config.js` is gate-scope, and removing a worktree
                  outside this run's declared radius) and flagged to the user
22:3x verify       ✓ fast: lint OK (pre-existing 4 warnings, 0 errors).
                  full: `npx jest --ci --roots src/app` (excluding the
                  pre-existing worktree pollution) → 52/52 green. `npm run
                  build` → green, no budget violations. `playwright test`
                  running to confirm deep
