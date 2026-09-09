# R3's two door-7 patches — apply manually

Same reason as every prior door-7 file this remediation touched: no
`HARNESS_DOOR_OPEN` path exists in this desktop-app session.

## What to do

```bash
cd /Users/emjot/dev/projects/mj-testing-playground
cp .ai/run/harness-v42-r3/patch-budget-gate-scope.mjs .claude/hooks/budget.mjs
cp .ai/run/harness-v42-r3/patch-verify.sh .ai/harness/verify.sh
chmod +x .ai/harness/verify.sh
```

Then let me know and I'll run `hook-test.sh`, `verify.sh smoke`, and `verify.sh deep`
against the live files to confirm, before committing.

## What each one does

**`budget.mjs`** — purely additive (confirmed by diff: only new code inserted, no
existing logic changed). Emits `.ai/harness/gate-scope.json` on every invocation:
the door-7 path list's one owner now, replacing what had drifted to six
independently hand-kept copies (one — the cheatsheet — was already missing an
entry). Two fields beyond the list itself: `missing` (a listed pattern that no
longer resolves to anything — the Angular 9→14 retool proved this happens
silently) and `observed_unlisted` (a config-shaped file *not* on the list —
reported, never blocked, matching the hook's own fail-open principle). Tested
directly against the current repo: `missing: []` (all 9 patterns resolve),
`observed_unlisted` correctly caught `.editorconfig` and `package-lock.json` as
real candidates worth a look.

**`verify.sh`** — two additions to the `deep` tier. First, a disclosure check: any
run with a `door-crossings.md` but no matching mention of the override in its
`digest.md` fails the gate (a run with no digest yet — still active, or
predating this mechanism — warns instead). Tested both directions with a
throwaway fixture run, cleaned up immediately after. Second, `check-citations.sh`
now gates `deep`, scoped to *only* the newest run's `digest.md` — not
`decisions/`, which turned out to have the same "cites a tree that later
legitimately changed" problem a brief has (found live: `decisions/0001` cites a
`conventions.md` a later decision deleted on purpose).

## Already applied directly (not gate-scope, no patch needed)

`.ai/harness/emit.sh` and `ledger.sh` (new), `.ai/prompts/retro.md` +
`.claude/commands/retro.md` (new), `.ai/harness/OWED.md` (new),
`.ai/harness/check-citations.sh` (bare-path resolution, zero-citation guard,
`mktemp`, `cite-base` pinning), `.ai/harness/handoff.sh` (stamps mid-run
snapshots), `.ai/prompts/digest.md` and `keep.md` (routing + new fields),
`.ai/harness/config.yml` and `.ai/HARNESS.md` (flow/tier updates, the
active-`HANDOFF.md` note), `README.md`, `docs/cheatsheet.html`,
`docs/vibe-harness.html`.

## One decision still open

`.ai/MODEL.md` is human-owned — a proposed replacement is in
`.ai/run/harness-v42-r3/proposed-MODEL.md`, described in this run's `digest.md`.
Apply it with:

```bash
cp .ai/run/harness-v42-r3/proposed-MODEL.md .ai/MODEL.md
```
