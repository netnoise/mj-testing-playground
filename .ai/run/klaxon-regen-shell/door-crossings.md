# Door crossings — klaxon-regen-shell

Disclosed **before** the human applies the patch, so the tree diff isn't an undisclosed crossing.
Door 7 (gate scope), human-applied from `.ai/run/klaxon-regen-shell/patch/gate-scope.patch`
(8 files, verified in a scratch clone: lint, jest, production build, `verify.sh deep` all green):

- `angular.json`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.spec.json`
- `setup-jest.ts`
- `.eslintrc.json` (deleted, replaced by `eslint.config.js`)
- `eslint.config.js` (new)
- `.claude/hooks/budget.mjs` (`GATE_SCOPE`: `.eslintrc.json` → `eslint.config.js`)

Why: decision 0008 §5 step 1, the Angular 21.2 regen approved with the plan. The agent cannot edit
these files; they were built and tested in a scratch clone and exported as a diff.

Earlier draft of this file also named `jest.config.js` and `playwright.config.ts` as possible
crossings. Neither changed (`jest.config.js` is byte-identical to the old one, and the
production-build `webServer` path needed no edit), so they are not in the patch and not listed here.
