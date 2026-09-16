# The ng-new scaffold is gone, vehicle-selection dropped, SCSS adopted
redesign/ui-shell · verify deep ✓ · ~68m · 28 files

### What surprised me

`.click({ force: true })` looked like the fix for the submit button being
unclickable and made the Playwright error disappear — but it didn't actually
fix anything. `force` only skips Playwright's own pre-click safety check; the
real mouse event it still dispatches gets routed by the browser's normal hit
testing to whatever is actually on top, which was `ng serve`'s live-reload
iframe. The form silently never submitted. The error going away was the
red herring, not the fix — `evaluate(el => el.click())` (calls the DOM method
directly, no hit testing involved) was.

Also: Playwright's `html` reporter only auto-opens and serves the report
(blocking the terminal forever, non-CI) when a run has a failure. A fully
green run just prints "run `npx playwright show-report`" and exits. The
apparent "hang" earlier was 2 failing tests, not a Playwright problem.

### What I learned about your system

- `jest.config.js`'s `testPathIgnorePatterns` only excludes `/node_modules/`
  and `/e2e/` — any git worktree placed anywhere under this repo (found:
  `.claude/worktrees/xenodochial-banzai-617355`, already pushed, safely
  removed) gets swept into `jest --ci` and fails on its own stale copy of the
  suite against its own separate `node_modules`.
- `advanced-form.component.spec.ts` did not actually compile under this
  repo's strict TS settings before this run — 16 unbracketed `.errors.x`
  reads (`TS4111`) and two Jasmine-style `spyOn(...).and.callThrough()` calls
  that don't exist under Jest. The commit that added it
  (`907ffdb`, "add reactive-forms showcase with full unit tests") had never
  actually been gated green.
- Before this run, `e2e/app.spec.ts`'s only two assertions were the `ng new`
  placeholder text and the vehicle brand→model flow — the one feature this
  branch actually added (`advanced-form`) had zero e2e coverage.

### Concept: a passing check can still deliver nothing

The `force:true` episode is the general case of something worth watching for
broadly: a check that reports success by testing "did my framework raise an
error" rather than "did the thing I intended actually happen" can go green
while doing nothing. Same shape as `HARNESS.md`'s own
`expect(x).toBeTruthy()` warning — the fix for a suspiciously-convenient
green is to verify the actual side effect (here: did `.submitted-value`
appear with the right content), not just that the action call didn't throw.

### What I did — and what is NOT verified

Deleted `src/app/vehicle/**` and its wiring; replaced the `ng new` scaffold
in `app.component.html` with a minimal header + `router-outlet`; converted
`app.component`/`advanced-form.component`/global styles to SCSS
(`angular.json`'s gate-scope edit applied by the user directly); fixed
pre-existing compile/test breakage in `advanced-form.component.spec.ts`;
rewrote `e2e/app.spec.ts` to drive `/advanced-form` for real (validation +
full submit). `verify.sh deep` is green: lint, 52/52 unit tests, production
build, and 3/3 Playwright tests against a real browser.

Not verified: visual appearance beyond what a DOM/computed-style inspection
in the Browser pane confirmed (no cross-browser or mobile-viewport check);
whether the production build's bundle-size budget still holds under a
*future* Material-free but larger feature set (`CLAUDE.md`'s 6kb/10kb and
2mb/5mb budgets — currently well under, per the build output, but not a
guarantee for what comes next).
