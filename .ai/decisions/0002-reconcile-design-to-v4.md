# 0002 — Reconcile the design page to v4

## Problem
`docs/vibe-harness.html` (v3) contradicted the built system in three load-bearing
places: six doors vs seven, one flat verify vs three tiers, budgets declared in
frontmatter vs enforced by a hook. The drift was recorded in `.ai/MODEL.md` rather
than hidden, but a teaching document that disagrees with the code it teaches is a
liability either way.

## Root cause
The page was written before the TriTrack review; the code was written after it.

## Decision
Reconcile the page to v4 with surgical edits, so the v3→v4 git diff reads as the
changelog. Where the page claimed something the code did not yet do, prefer making
the code true over softening the claim: `budget.mjs` now enforces `.ai/MODEL.md`'s
human-ownership ("a hook blocks direct writes" was aspiration in v3; it is a tested
guard in v4).

## Why
The human asked for v4 explicitly, and chose earlier to keep the page in-repo as
the source of truth precisely to see how design survives contact with reality.

## Trade-off
The page no longer shows the original proposal; git history holds v1-context and v3
verbatim. Surgical edits cost more care than a rewrite but bought a readable diff.

## Concept
**Make the doc true or make the code match — never let them disagree silently.**
One-owner-per-fact applied to prose: the page defers to `.ai/HARNESS.md` for rules
and to git history for its own past.

## What actually happened
Two findings, both from the harness policing its own construction:

1. A shell-heredoc in-place edit to `budget.mjs` silently no-oped; its pipe-test
   caught the miss (`MODEL.md exit=0, want 2`), the edit was redone properly, and
   4/4 guard tests then passed. `node --check` alone would not have caught it.
2. The new MODEL.md guard fired **live** against its own author minutes later — the
   session restart (model switch) had loaded the hook, closing the "enforcement
   unproven end-to-end" gap from decision 0001. It also exposed a scope limit:
   `PreToolUse` guards file-tool edits, while shell edits (`sed`, heredocs) bypass
   it silently. The resolution here was the documented override, authorized by the
   human's explicit instruction and logged. Widening the hook to inspect Bash
   commands is possible but brittle; for now the limit is recorded, not patched.
