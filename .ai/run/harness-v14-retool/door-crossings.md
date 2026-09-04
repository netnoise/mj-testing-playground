# Door/override crossings — harness-v14-retool
Authorized by: approved plan (this session), Part B, "documented override"

## .ai/harness/verify.sh
Rewrote gate contract for v14 toolchain: fast=eslint, full=+jest --ci,
deep=+build+playwright test. Removed karma/CHROME_BIN logic and the
"RUNTIME: NOT CONFIGURED" message - deep is now the real runtime oracle
(Playwright's webServer boots the app; e2e/app.spec.ts drives it).

## .claude/hooks/budget.mjs (edited via normal Edit tool - not yet self-guarded at edit time)
GATE_SCOPE updated: karma.conf.js/tslint.json -> jest.config.js, setup-jest.ts,
playwright.config.ts, .eslintrc.json. Added .claude/hooks/budget.mjs itself to
the list (the guard now guards itself going forward). 12/12 pipe-tests pass:
MODEL.md block+override, all 4 new configs block, self-guard blocks+overrides,
angular.json still blocks, removed configs (karma.conf.js) no longer special,
ordinary files pass, garbage stdin fails open.

## .ai/MODEL.md (human-owned; written via shell + HARNESS_DOOR_OPEN authorized by the approved plan)
Rewrote "What this repo is" for Angular 14 + vehicle-selection feature. Replaced
"Not yet true: no runtime oracle" with a "Runtime oracle" section describing what
verify.sh deep actually proves now. Updated invariants' gate-scope list. Added
"Known duplication" section flagging config.yml vs budget.mjs's two copies of
GATE_SCOPE (no fix - would require adding a YAML dependency, itself door 1).

## .ai/MODEL.md — self-correction (same run, same override)
First pass described vehicle-selection as already delivered ("decision 0004"),
which doesn't exist yet - Part D hasn't run. Corrected before moving on: this is
exactly the confident-fiction failure mode the harness is built to catch. MODEL.md
will be updated again, honestly, after the feature actually lands.

## playwright.config.ts (door 7, written via shell + HARNESS_DOOR_OPEN authorized by the approved plan)
Added PW_CHROMIUM env-gated executablePath so this container's preinstalled
Chromium (/opt/pw-browsers/chromium) can run e2e without a browser download.
Only applies when PW_CHROMIUM is set - Mac/CI behavior is byte-for-byte
unchanged when it isn't.

## package-lock.json (door 1, dependency_change - not hook-enforced; announced and crossed)
`npm ci` failed: "Missing: typescript@5.9.3 from lock file". Diagnosed: the
lockfile committed to master (bda9993) has a nested typescript@5.9.3 entry
under node_modules/@compodoc/ngd-core but is missing the identical sibling
entry under node_modules/@compodoc/compodoc - an incomplete/buggy lockfile as
committed, not anything from this session's merge. `npm install
--package-lock-only` regenerates it correctly: package.json is untouched, no
dependency's declared range changes, the only added line is that one missing
nested entry (same version/resolved/integrity as its sibling), plus 13 minor
"peer": true metadata differences elsewhere (likely an npm-version artifact
from whoever generated master's lockfile). This is a lockfile self-consistency
repair, not an intentional dependency change - but package-lock.json is
explicitly named in this harness's own door-1 list, so it's logged here
regardless of intent, per HARNESS.md's own rule for a door that isn't hook-
enforced: state it and continue rather than block.

Bank card candidate: "npm ci can fail with 'Missing: X from lock file' when a
committed lockfile has an incomplete nested peer/dedup entry, even though
package.json is untouched. Fix: npm install --package-lock-only, then diff
against the original to confirm no version or range actually changed before
trusting it."
