# Retro — hotfix-gate-and-claims

## Verdict
The run itself was the right size: four files touched, about seven minutes from `started_at`
(`.ai/run/hotfix-gate-and-claims/state.json:4`, 20:46Z) to the commits (about 20:53Z). That is my
estimate from commit time, since `state.json` has no close timestamp. The run existed because the
previous one under-verified, so the real cost of this work was avoidable: one skipped gate.

## Mistakes
1. **I never ran `deep` on the previous run, and reported it as green anyway.** Its digest opens
   with "verify full ✓" (`.ai/run/klaxon-claims-correction/digest.md:1`), and the tier table says `deep`
   is for "once before handing back" (`.ai/HARNESS.md:57`). Running it after the digest existed would
   have shown the red citation check on the spot. I ran it only when asked whether the harness was
   ready. Next time: `deep` is the last thing I run before I say "done", after the digest is written,
   and I say which tier I ran.
2. **I overstated the finding, and it spread.** I wrote that the heading test catches the demotion
   "by accident" and gives "no diagnosis". I got there from the null `TypeError` without checking that
   `querySelector('.app-header h1')` itself requires an `h1`. That went into five files and two claude.ai
   artifacts before an outside review caught it. The corrected reading is at
   `.ai/run/klaxon-claims-correction/evidence.md:24` and
   `.ai/decisions/0008-klaxon-claims-to-hypotheses.md:96`. It is the same shape as the mistake the
   previous run was correcting: an explanation that fit the story and was never tested against the
   code. Next time: after writing an interpretation, look for the one line of code that would contradict it
   *before* copying it into more than one place.
3. **I wrote bare paths into my own fix, twice.** The Replay text in evidence.md, and then the first
   draft of this run's digest, which quoted the bad paths as examples
   (`.ai/run/hotfix-gate-and-claims/journal.md:14`). I had just diagnosed exactly this. The explicit
   check caught both before the commit, but only because I ran it by hand. Next time: run
   `check-citations.sh` on each document right after writing it, not once at the end.
4. **The Views publish took three attempts.** I assumed a path-scoped `read` satisfied the version
   guard; it took a plain `read` of the artifact URL (`.ai/run/hotfix-gate-and-claims/journal.md:19`).
   No `force`, no data at risk. A lesson, not a mechanism.
5. Used `/tmp` for one scratch output despite the scratchpad rule. Removed at once.

## What the harness made harder than the task needed
- **A digest's citations are checked by nothing at close.** The documented loop runs `verify` before
  `digest` (`.ai/harness/config.yml:45`), on purpose (`.ai/harness/verify.sh:155`), and
  `.ai/harness/close-run.sh:32` lists no citation check. So a run can close "done" and leave `deep` red
  on the trunk, which is what happened. This is the mechanism behind mistake 1, so it is in OWED.md.
- **Two definitions of "citations OK".** `verify.sh` gates only `digest.md` and `retro.md`
  (`.ai/harness/verify.sh:166`); the no-argument `check-citations.sh` checks every markdown file in
  the run (`.ai/harness/check-citations.sh:26`). `evidence.md` is in neither gate but broke under the
  wider check. I only knew because I ran that check by hand.
- **With no active run, `deep` checks the last closed run** (`.ai/harness/verify.sh:164`), so a closed
  run's paperwork can redden a clean trunk later. The allowlist handled the fix fine once I added the old
  run's directory when opening this one.
- **The checker can't describe a bad citation.** Quoting one as an example, or using an ellipsis
  shorthand, is itself flagged (`.ai/harness/check-citations.sh:94`). One extra rewrite. A lesson, not
  a mechanism.

## Human touches
- **Door-7 patches handed over:** none. This run directory has no patch files and no
  `door-crossings.md`.
- **Questions I stopped and asked:** one `AskUserQuestion` round in plan mode (push target, and which
  extras to include), answered "hotfix branch, no PR yet" plus both extras. Then plan approval.
- **Corrections the human made to my work:** none directly in this run. The scope came from the owner's
  pasted outside re-review, which is where mistake 2 surfaced, and from "plan first, fix all, commit and
  push as a hotfix" (`.ai/run/hotfix-gate-and-claims/input.md`). After the retro, the owner asked for
  it to be committed and a PR opened.

## Owner's view
Added at the owner's request. These are their words, not my assessment:
- "the harness is more getting in the way than helping so far"
- "running this deep gate 15 times is waste of time and energy"

Cross-check, mine and not the owner's: by my count I ran `deep` six times in this session, `full`
twice and `fast` once. I can't see fifteen, which may include runs from before this session or runs in
the owner's own terminal. One timed `deep` run took about 12 seconds of wall clock, so the cost the
owner describes is mostly the reruns I triggered and the reading and rewriting around each one, not
machine time. Two of the six followed my own citation mistakes, and the last two re-proved a tree whose
only changes since the previous green run were paperwork. One run found a real defect, the red
citation check on the trunk. The OWED entry I added proposes one more check at close. Given this view,
whether to build it or to cut the reruns instead is the owner's call.

## What actually happened
Matches the digest, with one imprecision: its header says "~10m", and the timestamps above say about
seven.
