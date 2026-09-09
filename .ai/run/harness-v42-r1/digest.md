# enforced: is now true, and self-tested
harness/v4.2-remediation · verify full ✓ · ~35 min · 9 files

### One decision for you

None. `decisions_needed: []` — nothing here needed your judgment; every choice was
either specified by the approved plan or a mechanical consequence of it.

### What surprised me

Two things, both caught by the very mechanism being built — the strongest evidence
this run produced:

1. **The new Bash guard has a real false-positive shape, found live, not hypothetically.**
   Bundling a legitimate `state.json` edit (Python, no shell write verb) in one Bash
   call with an unrelated `journal.md` `>>` append tripped the state.json-write regex,
   because it scans the whole command string rather than tying a write verb to its
   actual target. Workaround: split into separate calls. Not fixed — the plan called
   this heuristic "too heuristic, deliberately," and a first real instance is better
   evidence for whether it's worth tightening than a hypothetical one. See
   `.ai/run/harness-v42-r1/journal.md` line 18:21.
2. **Making `state.json` write-once created a problem the plan didn't anticipate:**
   there was no sanctioned way to mark a run `done` short of `HARNESS_DOOR_OPEN` every
   time — which is the exact routine-override pattern this run exists to remove for
   the mid-run case. Fixed by adding `.ai/harness/close-run.sh`, on the same
   no-model-call, git-as-truth model as `handoff.sh`. This was mid-run scope growth
   (`.ai/run/harness-v42-r1/journal.md` line 18:20), disclosed and applied via the sanctioned escape valve
   `.ai/prompts/understand.md` already names for exactly this situation.

### What I learned about your system

1. `.claude/settings.json`'s `PreToolUse` matcher change **takes effect immediately** —
   no session restart needed. Confirmed live at the start of the next run
   (`.ai/run/harness-v42-r2/journal.md:9`): its very first Bash call was intercepted
   by the Bash-guard path, which only exists because the matcher now includes `Bash`.
   `.ai/HARNESS.md`'s "restart after editing a prompt, hook or command file" rule
   covers `.ai/prompts/` and `.claude/commands/`; it does not extend to
   `settings.json`'s hook registration, which the runtime re-reads per call.

   **Correction (2026-09-09):** this item originally claimed the opposite, and the
   closing section below told you to restart before trusting the guard. Both were
   wrong — in the direction that costs a real session for no reason. Corrected in
   place rather than left standing with the fix recorded only in another run's
   journal; `.ai/run/harness-v42-closeout/retro.md` records why leaving it was
   itself the mistake.
2. The negative control I wrote for `hook-test.sh` initially proved nothing: breaking
   the `dir/**` fast-path branch didn't change behavior for a single-level file,
   because the fallback regex branch (`[^/]*` repeated) accidentally handles that
   case too. Only a payload naming a file several directories deep — the fixture
   uses a synthetic "deeply/nested" path under the allowlisted root, which by
   design never exists on disk — exercises the code path that `dir/**` alone can
   match. Fixed; kept as the permanent case.
3. `files_touched` is now visibly larger than before for the same work, because it
   counts the run's own scaffolding (`state.json`, `journal.md`) via
   `git ls-files --others` — previously invisible since those are untracked and the
   old accumulator only recorded what a tool call explicitly touched. Not a bug: it's
   the honest count, including the run's own bookkeeping.

### Concept: an enforcement mechanism's escape hatch needs its own sanctioned exit

The root failure this run fixes (`rm state.json` as routine) existed because the
guard had an entry (deletion) with no corresponding *legitimate* exit for the one
case that actually needed one (ordinary brief revision). Fixing the entry
(implicit run-dir permit) without also providing the legitimate exit for the
*other* case that turns out to need one (closing a run) would have reproduced the
same shape one level down — which is exactly what happened when I went to close
this very run. Generalises: any write-once or single-writer guard needs an audited
mechanical path for its one legitimate multi-step lifecycle transition, not just a
block plus an override flag. Same shape as `.ai/harness/handoff.sh` already
demonstrates for `HANDOFF.md`.

### What I did — and what is NOT verified

Rewrote `.claude/hooks/budget.mjs` (run-dir implicit permit, Bash scanning,
git-derived `files_touched`, `state.json` write-once, `.claude/settings.json` added
to `GATE_SCOPE`); extended `.claude/settings.json`'s matcher to include `Bash`;
added `.ai/harness/hook-test.sh` (14 cases plus a live negative control) and wired
it into `verify.sh full`; added `.ai/harness/close-run.sh`; updated
`.ai/prompts/understand.md` and `.ai/HARNESS.md` to describe the new behavior.
`verify.sh full` is green, including `hook-test.sh`.

**Not verified during this run:** the `.claude/settings.json` matcher change itself,
live. `hook-test.sh` verifies `budget.mjs`'s logic directly (by invoking it with a
crafted payload), which is real coverage of the code but independent of whether the
running session's matcher had picked it up. That wiring was confirmed at the start
of the next run instead — see the correction above; it needed no restart, and the
guard was already live.
