# Journal — klaxon-claims-correction

- 15:28Z open-run (feature, 12 files / 60m). base `cb11246`. → active.
- Baseline `npx jest src/app/app.component.spec.ts` → 3/3 pass.
- M1 h1→div → FAIL, TypeError null.textContent at :33. Reverted.
- M2 scss-only rename → PASS. M3 template+scss rename → FAIL, identical TypeError. Reverted; `git diff -- src/ e2e/` empty.
  → evidence.md. The prediction in write-up §01 / 0006 item 1 ("stays green") was falsified.
- Write-up: §01 replaced with the recorded table. §02 SVG relabelled (crash / hit? / miss?,
  "1 recorded, 4 predicted"). §03 matrix → hypothesis marks plus a legend and question-style verdicts.
  §07 rewritten with a milestone-1 stopping rule and Go moved to step 8. Door-1 reference updated.
- README: "Known, deliberate gap" → "Planned mutation"; added "Claims and evidence". Wireframe rows
  and the artifact staleness note updated.
- board.html callout reworded. findings.html: featured card → hypothesis; matrix banner; heading
  unit cell → "!"; stat tiles 7 planted / 6 of 7 caught / 1 never → 7 planned / 1 of 31 recorded / 30
  hypotheses (35 cells minus 4 n/a).
- 0008 written. Correction pointers appended to 0006 and 0007.
- verify full → OK (lint, jest, hook-test 23/23).
- Render check in the browser pane: the §02 SVG label "catch?" overlapped "e2e · playwright" by 8px
  (getBBox 568 vs 560). Changed to "hit?" (starts at 574). Board callout and findings card render cleanly.
