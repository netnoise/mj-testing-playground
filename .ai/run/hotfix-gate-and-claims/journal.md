# Journal — hotfix-gate-and-claims

- 20:46Z open-run (feature, 12 files / 60m). base `12d0732`. Branch `hotfix/klaxon-gate-and-claims`.
- Replay: baseline / M1 / M2 / M3 / restored run at HEAD, patches and full Jest output saved under
  `.ai/run/klaxon-claims-correction/mutations/`. exit codes 0 / 1 / 0 / 1 / 0. `git diff --stat HEAD -- src e2e` empty.
- `replay.sh` written and run once: PASS / FAIL / PASS / FAIL against the recorded values, tree clean after.
- evidence.md: results table kept, "What this shows" replaced by "Revised reading" (three properties)
  plus a "Replay" section. Old digest: citation fixed, "undiagnosable" reworded, amendment noted.
- 0008: appended "Amendment" (append-only; body untouched).
- Write-up: §01 paragraph, §02 figcaption, SVG aria-label and unit label (`crash` → `fail`), table tooltip
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
