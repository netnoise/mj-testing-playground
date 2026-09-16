# Patch: widen the citation gate to retro.md

Door-7 file, so it needs you. One localised change to the citation block at the
end of `verify.sh`; nothing else in the file moves.

## What to do

```bash
cd /Users/emjot/dev/projects/mj-testing-playground
cp .ai/run/harness-v42-landing/patch-verify-widen-citations.sh .ai/harness/verify.sh
chmod +x .ai/harness/verify.sh
```

## What it changes

The gate checked only the newest run's `digest.md`. A run that produced a
`retro.md` and no digest got **no citation checking at all** — which is exactly
what happened on the run that found this: the gate printed `skipping, not a
pass` and examined nothing. Now it checks whichever of `digest.md` and
`retro.md` exist, and both when both do.

`brief.md` and `decisions/` stay excluded, unchanged and for the reasons already
in the file's comment: a brief cites a tree its own run then changes, and a
decision record is defined as past-tense and append-only. `digest.md` and
`retro.md` are the two present-tense artifacts, both written as a run concludes,
both describing what should currently be true — so both are safe to gate.

**The empty case stays non-fatal on purpose.** The documented loop is
`understand → implement → test → verify → digest → record`: verify runs *before*
digest, so at `deep` time a digest legitimately may not exist yet. Hard-failing
would break the loop's own ordering. It reports that nothing was checked rather
than letting silence read as green.

## Tested before handing it over

Against controlled fixtures, using the block extracted verbatim from the patch
rather than a retyped copy:

| case | result |
|---|---|
| retro only (the bug) | checked — 1 doc, 1 citation |
| digest + retro | checked — 2 docs, 2 citations |
| neither | non-fatal, names the run, says nothing was checked |
| **fabricated citation in a retro-only run** | **fails, exit 1** — previously invisible |

The last row is the one that matters: it is the case that silently passed before.

## One thing not fixed

`LATEST_RUN` is chosen by `ls -1t`, i.e. mtime. Editing an *old* run's digest
makes that run "newest" and gates it — this already happened once, when
correcting R1's digest pulled a two-day-old run into the gate and surfaced a
stale path in it. Harmless so far, arguably useful, but it means "newest run"
means "most recently touched", not "most recent work". Left alone rather than
redesigned as part of a widening fix; worth a note in `OWED.md` if it bites.
