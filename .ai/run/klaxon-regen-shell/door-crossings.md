# Door crossings — klaxon-regen-shell

Disclosed **before** the human applies the patch, so the tree diff isn't an undisclosed crossing.
Door 7 (gate scope), human-applied from `.ai/run/klaxon-regen-shell/patch/gate-scope.patch`:

- `angular.json`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.spec.json`
- `jest.config.js`
- `setup-jest.ts`
- `.eslintrc.json` (deleted, replaced by `eslint.config.js`)
- `eslint.config.js` (new)
- `.claude/hooks/budget.mjs` (`GATE_SCOPE`: `.eslintrc.json` → `eslint.config.js`)
- `playwright.config.ts` only if the scratch build shows `webServer` needs it (expected: no)

Why: decision 0008 §5 step 1, the Angular 21.2 regen approved with the plan. The agent cannot edit
these files; they are built and tested in a scratch clone and exported as a diff.
