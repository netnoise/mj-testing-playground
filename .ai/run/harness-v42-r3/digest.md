# One owner for the door list, and the artifacts that never got built
harness/v4.2-remediation · verify full ✓ (deep pending your two patches) · ~50 min · 21 files

### One decision for you

**Apply the proposed `.ai/MODEL.md` diff?** `.ai/MODEL.md` is human-owned; the hook
blocks every write to it regardless of override reachability, so this is a proposal,
not a change already made. Full replacement text is in
`.ai/run/harness-v42-r3/proposed-MODEL.md`. **Default: apply it as-is** — it corrects
a stale reference to a deleted feature (`VehicleService` etc., gone since decision
0005) that had read as clean for a full phase, updates the invariants section for
`state.json`'s new write-once behavior, and resolves "Known duplication" (the door-7
list now has one owner). **Cost of being wrong:** low and easily reversible — it's a
markdown file describing the system, not code; a wrong sentence here misleads the
next `/understand` pass but breaks nothing mechanically.

### What surprised me

1. **Decisions have the identical historical-citation problem briefs do, found by
   actually building the citation gate rather than reasoning about it.** Gating
   `check-citations.sh` over `.ai/decisions/*.md` in `verify.sh deep` seemed safe —
   until it correctly flagged `.ai/decisions/0001-adopt-the-harness.md` citing a
   conventions.md that was deleted on purpose by a *later* decision. `.ai/HARNESS.md`
   itself defines a decision record as "past tense, append-only" — checking one
   against the live tree contradicts its own definition. Scoped the gate to only
   the current run's digest (present-tense, written at the moment its run
   concludes) instead. This is exactly the kind of finding this run's own thesis
   predicts: a mechanism can look correct until it's actually run against real data.
2. **`HARNESS_DOOR_OPEN` genuinely cannot be reached from a Bash command-embedded
   env prefix, confirmed a third time**, this time by design rather than
   accident — every door-7 edit in this run (`budget.mjs`'s `gate-scope.json`
   emission, `verify.sh`'s disclosure + citation gates) was written as a patch
   file from the start rather than attempted directly, since R1 and R2 already
   established the mechanism doesn't work in this desktop-app session.
3. **The Bash guard's write-verb-scans-whole-command-string false positive
   recurred twice more** in this run alone (a legitimate `gate-scope.json` test
   command mentioning `budget.mjs`; a `cp`-based backup attempt whose *source*
   filename happened to match a needle). Five real instances now across three
   runs — this has stopped being an edge case. Logged as the top item in the new
   `.ai/harness/OWED.md` rather than fixed here (out of this run's declared file
   scope, and fixing it well needs more thought than a quick patch).

### What I learned about your system

1. `docs/vibe-harness.html`'s "Three shelves, one of them yours" heading
   contradicted its own content (four shelves were already listed) before this
   run touched it — a pre-existing inconsistency, not one of the audit's six
   flagged items, noticed only because this run was already editing the same
   section for `OWED.md`. Fixed alongside it (now five shelves, two yours).
2. `.ai/harness/gate-scope.json`'s `observed_unlisted` scan, run for real against
   this repo, correctly surfaced `.editorconfig` and `package-lock.json` as
   config-shaped files not in the door-7 list — real, reasonable candidates for a
   human to look at, not false alarms.
3. The retro prompt this run built (`.ai/prompts/retro.md`) is dogfooded by this
   very digest's honesty about item 1 above — before this run, a finding like
   "I built the wrong gate and had to narrow it" would have had no natural home
   between a technical summary and silence.

### Concept: a mechanism's own stated boundary is the test that catches it

Both surprises above have the same shape: `.ai/HARNESS.md` and `.ai/MODEL.md`
already stated the boundary that would have predicted the citation-gating problem
("a decision record is past tense, append-only") before this run went looking for
it — the docs were right, the *implementation* just hadn't been checked against its
own documented promise yet. Generalises: when adding a gate over an existing
artifact type, re-read that artifact type's own stated definition first, not just
its current contents — the definition often already names the edge case.

### What I did — and what is NOT verified

Built `.ai/harness/emit.sh` and `ledger.sh` (the corpus the delta note's 1.6 assumed
existed and didn't — zero emits existed anywhere in this repo before this run);
`.ai/prompts/retro.md` + `.claude/commands/retro.md`; a "What I got wrong" section
in `digest.md`'s own template; `handoff.sh` now stamps mid-run snapshots so they're
never mistaken for a final state; `check-citations.sh` now resolves bare-path
citations, guards against zero-citation vacuous passes, uses `mktemp`, and supports
a `<!-- cite-base: <sha> -->` header for pinning a document to the commit it
describes; `keep.md` gained a `mechanism:` field; `.ai/harness/OWED.md` is new and
populated with three real, current items; `README.md`'s stale Angular-9 half is
gone; `docs/cheatsheet.html` and `docs/vibe-harness.html` no longer enumerate the
door-7 list and no longer describe unbuilt mechanisms as built — six flagged
corrections plus two more found live while there.

**Two door-7 patches need your action** — `.ai/run/harness-v42-r3/patch-budget-gate-scope.mjs`
and `.ai/run/harness-v42-r3/patch-verify.sh`, with `PATCH-NOTES.md` alongside them.
`verify.sh full` is green (confirmed against the *current live* `budget.mjs` and
`verify.sh`, which don't yet have this run's changes — `hook-test.sh`'s 14 cases
plus this run's manual tests all pass against the *patched* copies, but the patches
themselves are unapplied). `.ai/harness/gate-scope.json` exists on disk from a
manual test run of the patch (not the live hook) — regenerate it by applying the
patch and touching any file once `budget.mjs` is live.

**Not verified:** `verify.sh smoke`/`deep` against the applied patches — pending;
the citation-gate's behavior against a *real* digest.md at gate time (this digest
is the first one it would actually check, once the patch lands); and, same as every
run this session, `spent.min` in this run's own emit is negative — this run's
`state.json` has the same placeholder-timestamp mistake R1's did, not fixable
(write-once, no override here).
