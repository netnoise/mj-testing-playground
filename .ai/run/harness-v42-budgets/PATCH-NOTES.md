# One more door-7 patch: budget.mjs's fallback defaults

Same reason as R2's three patches — no `HARNESS_DOOR_OPEN` path exists in this
desktop-app session, so this two-line change is a patch file, not a direct edit.

## What to do

```bash
cp .ai/run/harness-v42-budgets/patch-budget.mjs .claude/hooks/budget.mjs
```

Then let me know and I'll run `hook-test.sh` against the live file to confirm.

## What it does

Bumps the hook's fallback defaults from `12`/`45` to `30`/`90` — matching the new
`config.yml` default. This fallback only matters if a `state.json` is somehow
missing `max_files`/`max_minutes` (every one `/understand` writes sets them
explicitly), so it's a low-stakes consistency fix, not a behavior change for any
real run. Verified against a copy: door 7 and every other check still fire
correctly (`node .ai/run/harness-v42-budgets/patch-budget.mjs` tested directly).

## Already applied directly (not gate-scope, no patch needed)

- `.ai/harness/config.yml` — default budget `12 files / 45 min` → `30 files / 90 min`.
- `.ai/prompts/understand.md` — the example `state.json` template updated to match.
- `.ai/prompts/implement.md` — frontmatter `budget: 45m · 12 files` → `90m · 30 files`,
  plus R2's deferred note: run `smoke` at a checkpoint, not just at hand-back.
- `.ai/HARNESS.md` — tier table updated for four tiers (R2's deferred item).

## Why 30/90, not something else

Sized to the largest real run on record: `ui-shell-redesign` touched 30 files in
about 90 minutes, and its own time budget was already extended to 90 once
(decision 0005) — not picked as a round number. `harness-v42-r2` hit the old
12-file cap with real, in-scope work still outstanding, which is what prompted
this.
