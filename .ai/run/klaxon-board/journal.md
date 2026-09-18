# Journal — klaxon-board

- opened via open-run.sh on branch claude/klaxon-board from master cb8d0d5, type feature, 25 files / 90 min.
- door 1 (approved with the plan): npm i -D @testing-library/dom (^10.4.2) — first use is the board component spec.
- wrote incidents/{incident,format-age,incident-fixture,incident-source}.ts + specs, board.{ts,html,scss,spec.ts}, shell (app.html/scss/config), styles.scss, e2e/board.spec.ts. Next: lint + jest, then verify smoke, then deep.
- sanity controls (NOT findings, not the planned mutations): A) INC-2891 severity critical->minor: jest 2 failed, e2e 1 failed. B) filter narrows nothing: jest 2 failed, e2e 1 failed. Both reverted; git diff empty after each.
- copy: removed "Try again in a moment." (no retry exists). scss: td nowrap except title column, after visual check.
