# R2 door-7 patch set — apply manually

Discovered mid-run: in the Claude Code desktop app, there is no way for either the
agent or the user to inject `HARNESS_DOOR_OPEN=1` into the running session's hook
process — the hook is invoked by the app's own backend, not by anything visible in
a terminal. So the plan's original design ("agent edits these under the disclosed
override") doesn't work here; these three door-7 files are prepared as patches
instead, same as `playwright.config.ts`/`jest.config.js` were always going to be.

## What to do

Copy each patch file over its target (or open both and apply by hand — the diffs
are small):

```bash
cp .ai/run/harness-v42-r2/patch-verify.sh .ai/harness/verify.sh
cp .ai/run/harness-v42-r2/patch-playwright.config.ts playwright.config.ts
cp .ai/run/harness-v42-r2/patch-jest.config.js jest.config.js
chmod +x .ai/harness/verify.sh
```

Then tell me, and I'll run `verify.sh smoke` and `verify.sh deep` to confirm
everything is wired correctly before committing.

## What each one does

**`verify.sh`** — adds a fourth tier, `smoke`, between `full` and `deep`. Both
`smoke` and `deep` now build the app and serve the actual `dist/` output via
`e2e/serve-dist.mjs` (a new, zero-dependency static server) instead of `ng serve` —
so a green run means the artifact `npm run build` produced actually executed, not
a dev server that may be a leftover process of unknown provenance. `smoke` runs
only the new generic route-mount check (`e2e/smoke.spec.ts`); `deep` adds the full
feature spec (`e2e/app.spec.ts`) on top. Both now pass `--reporter=line`, which
also fixes the terminal-blocking "hang" from Playwright's default HTML reporter on
a non-CI failure (decision 0005 / the ui-shell-redesign retro's mistake #3).

**`playwright.config.ts`** — `webServer.command` and `reuseExistingServer` switch
on a new `HARNESS_DEEP` env var (set by `verify.sh`'s `smoke`/`deep` tiers).
Ordinary `npm run e2e` is untouched — still `ng serve` with reuse, for a fast local
loop. Only the harness's own gate now serves the real build with reuse forced off.

**`jest.config.js`** — one line: `testPathIgnorePatterns` now also excludes
`/\.claude/`, so a git worktree under `.claude/worktrees/**` can't sweep its own
stale test copy into `jest --ci` again (this exact thing broke `verify full`/`deep`
once already, per decision 0005).

## Files this patch set also adds directly (not gate-scope, already in place)

- `e2e/serve-dist.mjs` — the static server.
- `e2e/smoke.spec.ts` — the generic route-mount check.

Both were written normally (no override needed) and are already on disk.
