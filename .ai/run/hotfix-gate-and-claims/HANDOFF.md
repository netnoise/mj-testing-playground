# HANDOFF - hotfix-gate-and-claims
generated mechanically 2026-09-18T21:18:05Z - no model call

## Goal
# master fails `verify.sh deep`, CLAUDE.md is stale, and the heading-test finding is overstated
run: hotfix-gate-and-claims · intake 2026-09-18

## Journal tail
```
  and verdict. findings.html: tooltip and verdict.
- CLAUDE.md: Project paragraph, component-styles bullet, gate tiers.
- Wording grep: only the quoted-original sentences remain. check-citations on the old digest + evidence:
  first pass BAD on three bare relative paths I had just written into evidence.md's Replay text (two
  output files and the replay script); fixed with full repo-relative paths, then "all citations
  resolve (2 doc(s), 9 citation(s))". My first digest draft quoted those paths as examples and tripped
  the same check, so the digest describes them in words.
- `verify.sh deep` (digest not yet written): green, WARN for harness-v14-retool only.
- Lab artifact republished: version 5. Views: two refusals (a newer version saved from inside the page).
  The newer version differed only in the canvas index (editor re-save: sorted keys, `attachments`, note
  `w`) and re-read showed Main/Showcase/Triage/Archive unchanged from what I had published. After a plain
  `read` of the artifact URL the third attempt succeeded without `force`: version 7, only `Showcase.dc.html` sent.
```

## Tree state (git is the truth, not any claim above)
```
branch: master  head: 32e5dc6
?? .ai/run/2026-09-15-landing-page/
?? .ai/run/2026-09-18-next-development-step/
?? .ai/run/harness-v42-landing/HANDOFF.md
?? .ai/run/harness-v43-critical/HANDOFF.md
?? .ai/run/hotfix-gate-and-claims/HANDOFF.md
?? .ai/run/old-baseline-findings/
--
```

## Last emit
```
(none with an "at" field - emit.sh hasn't been called since this fix, or not at all for this run)
```

## Resume
```
git checkout master && /resume hotfix-gate-and-claims
```

> A clean exit is not evidence of work. Diff the tree before believing
> anything the journal claims.
