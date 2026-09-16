# Patch: door 7 becomes a tree check, not a command-string scan

Three door-7 files, so they need you: `.claude/hooks/budget.mjs`, `.ai/harness/verify.sh`, and
(non-gate-scope, but sequenced with the other two — see "Apply all three together" below)
`.ai/harness/hook-test.sh`. Addresses docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.1/§1.3/§1.6,
plus one new finding from this run (the sweep's own `state.json` gap, and one new Bash bypass shape).

## What to do

```bash
cd /Users/emjot/dev/projects/mj-testing-playground
cp .ai/run/harness-v43-critical/patch-budget.mjs .claude/hooks/budget.mjs
cp .ai/run/harness-v43-critical/patch-verify.sh .ai/harness/verify.sh
cp .ai/run/harness-v43-critical/patch-hook-test.sh .ai/harness/hook-test.sh
chmod +x .ai/harness/verify.sh .ai/harness/hook-test.sh
git add .claude/hooks/budget.mjs .ai/harness/verify.sh .ai/harness/hook-test.sh .ai/harness/gate-scope.json
git commit -m "harness: apply the door-7 tree-check patch"
sh .ai/harness/verify.sh full
```

**Commit before running `verify.sh` — not after.** This patch's own new preflight (in
`verify.sh`, run before any tier) diffs the tree against `HEAD` when no run is active, and fails
if a protected file differs and isn't disclosed. `cp`-ing these three files in *is* exactly that
kind of diff, so running `verify.sh full` on the still-uncommitted copy fails with
`undisclosed protected-path crossing(s): .ai/harness/verify.sh, .claude/hooks/budget.mjs` — hit
live applying this patch for the first time; not a bug in the check, just a missing step in this
note. `.ai/harness/gate-scope.json` is the auto-regenerated report file (not gate-scope itself,
safe to commit alongside — `lib.mjs` shows up in its `patterns` list once `budget.mjs` runs once).

**Apply all three together, not one at a time.** `hook-test.sh`'s new cases assert the tree-check
behavior that only exists once `budget.mjs` is patched — applying `hook-test.sh` alone first would
turn `verify.sh full` red for no real reason (I tested this deliberately, see below). None of the
three is gate-scope-protected *against each other*, so nothing stops a partial apply except this
note.

## What changes, and why

**The problem, verified live at `1e644ea` before writing this patch** (six commands probed by
piping a synthetic tool-call payload into the hook — nothing executed):

| command | old hook | why |
|---|---|---|
| `node -e "...writeFileSync('jest.config.js',...)"` | **allowed** | verb not in the write-verb regex |
| `python3 -c "open('angular.json','w')"` | **allowed** | same |
| `npx prettier --write angular.json` | **allowed** | same |
| `git apply <patch touching a gate-scope file>` | **allowed** | same (new finding, not in the delta) |
| `npx eslint --fix .eslintrc.json` | **allowed** | same (new finding) |
| `cp angular.json /tmp/x` (a *read*) | **blocked** | needle matched, verb matched — wrong target |

The mechanism: the old Bash check scanned the *whole command string* for a write verb *anywhere*
and a protected filename *anywhere*, with no relation between them. `.ai/harness/OWED.md`'s
documented workaround for the resulting false positives — "copy with Python" — is itself one of the
bypasses.

**The fix.** `.ai/harness/lib.mjs`'s `gateDiff()` (already landed, not gate-scope, see this run's
first commit) compares the real tree against the run's `base_commit` and flags any protected path
that changed and isn't named in `.ai/run/<slug>/door-crossings.md`. It sees a write from *any* tool,
because it's a git diff, not a verb parser. It can't prevent the write — this hook runs before the
tool call, and a Bash command's effect isn't knowable without running it — so instead: once an
undisclosed protected diff exists, every subsequent `Edit`/`Write`/`MultiEdit`/`NotebookEdit`
*outside the active run's own directory* is refused until it's disclosed or reverted. `verify.sh`'s
matching preflight (same `gateDiff` call) runs before any tier, so a crossing that slips past one
missed hook call still can't produce a green gate.

**`.ai/harness/lib.mjs` joins `GATE_SCOPE`.** It now decides what counts toward every budget and
every door-7 crossing, so it needs the same protection the hook and `verify.sh` already have.

**`.ai/MODEL.md` is covered by the same sweep** (a separate list, `PROTECTED_PATHS`, not merged
into `GATE_SCOPE`/`gate-scope.json` itself — it's a different door with the same mechanism, not
part of "a gate's own scope").

**The file budget now survives a WIP commit.** Old ruler: `git diff --name-only HEAD` — resets on
every commit, and the harness itself mandates a WIP commit on every green step
(`.ai/HARNESS.md:107`), so a compliant run could never hit `budget_spent`. New ruler:
`runTouched(state)`, diffed from `base_commit`. Tested directly (see below): a fixture with
`max_files=1`, one file already committed mid-run, correctly still blocks a second file.

**Corrected the four "re-run with `HARNESS_DOOR_OPEN=1`" hook messages** — that instruction cannot
work as a per-command prefix; the hook reads its own process environment, not the command's. The
messages now point at what actually works (session-level, human-set) or at proposing a diff.

## Not fixed by this patch — known, documented gaps

- **A Bash write to a run's `state.json` via a non-listed verb** (e.g. `node -e
  "...writeFileSync('.ai/run/x/state.json', ...)"`) is still not blocked — the narrow `state.json`
  regex is unchanged, kept exactly as the delta note recommended ("path-specific, rarely misfires"),
  but it still sits behind the same write-verb-list gate the removed checks did. Included as a
  `[KNOWN GAP]` case in the new `hook-test.sh` so it's visible on every `full`, not silently unnoticed.
- **A protected-path crossing with NO active run, that gets committed** (not just left uncommitted)
  is invisible to both the hook's sweep and `verify.sh`'s preflight — both compare against `HEAD`
  when no run is open, and a commit *is* the new `HEAD`. Tested directly (see below, last row of
  the preflight table). Bounded: it requires no run being open at all, which is outside this
  harness's normal flow.
- **Re-tuning 30/90** is deliberately not part of this patch — the ruler just changed under it; the
  brief for this run says to re-measure over 3+ real runs before touching the numbers.

## Tested before handing it over

Both new tests live in this run's directory; neither touches the live `.ai/run` or the live
gate-scope files.

**`.ai/run/harness-v43-critical/patch-hook-test.sh`** — the proposed `hook-test.sh`, run entirely
inside a fresh `mktemp` git repo (fixes the delta's §1.6 finding too: the old version stashed the
*live* active run's `state.json` with a `trap ... EXIT INT TERM`, which a `SIGKILL` mid-test can't
run, silently leaving enforcement off for the rest of a real run). 23 cases, including the two the
old suite didn't have:

```
sh .ai/run/harness-v43-critical/patch-hook-test.sh .ai/run/harness-v43-critical/patch-budget.mjs
# -> hook-test: all 23 cases pass
```

Run **against the live, unpatched hook** for comparison — the same 23 cases:

```
sh .ai/run/harness-v43-critical/patch-hook-test.sh .claude/hooks/budget.mjs
# -> hook-test: FAILED (4 of 23)
```

The 4 failures are exactly the shapes this patch changes: the WIP-commit budget case, the sweep
case, one Bash case that now intentionally behaves differently (the old hook still blocks a direct
`sed -i` on a gate-scope file at the Bash-check stage; the new one lets it through there and catches
it on the *next* call instead), and one negative control that's a no-op against a hook that has
nothing for it to gut. This is the regression evidence, not just a clean run of the new suite.

**`.ai/run/harness-v43-critical/test-verify-preflight.sh`** (+ `preflight-check.mjs`, a standalone
copy of the patch's `DISCLOSURE_FAIL` logic — avoids retyping it inline as a shell-quoted string) —
6 cases against the same kind of fixture repo: no run/no diff, active run/no diff, undisclosed
diff (fails), disclosed diff (passes), and the two "no active run" edge cases including the known
gap above.

```
sh .ai/run/harness-v43-critical/test-verify-preflight.sh
# -> preflight-test: all 6 cases pass
```

## One thing to watch after applying

`verify.sh full`'s hook-test step will now run the *new* `hook-test.sh` against the *patched*
`budget.mjs` for the first time outside this throwaway-repo testing — expected to pass (23/23,
same as above), but this is the first time the two run together against the real repo layout
rather than a fixture.
