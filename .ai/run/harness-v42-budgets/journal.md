# Journal — harness-v42-budgets

User direction after R2 hit its own 12-file cap with real work still left:
"those budgets definitely seem too restrictive - 12 files and 400 lines changed
and that's it? increase those budgets across the harness rules." Evidence:
ui-shell-redesign (a normal-sized feature run) touched 30 files in ~90 minutes,
already extended past the 45-minute default once (decision 0005). Also picks up
R2's two deferred doc edits (implement.md smoke-checkpoint note, HARNESS.md tier
table) since both runs touch the same prompt/config files.

New defaults: max_files 12 -> 30, max_minutes 45 -> 90. Sized to the largest real
run on record, not an arbitrary round number.

22:31 ↦ config.yml: default budget 12/45 -> 30/90
22:32 ↦ understand.md: example state.json template updated to match
22:33 ↦ implement.md: frontmatter budget line updated; smoke-checkpoint note added
22:34 ↦ HARNESS.md: tier table updated for 4 tiers (fast/full/smoke/deep)
22:35 ↦ budget.mjs fallback defaults (door-7): prepared as a patch, not applied -
       same desktop-app HARNESS_DOOR_OPEN limitation as R2.

--- resumed (app was quit and restarted) ---
22:50 ↦ /resume: verified rather than trusted. git diff confirmed the
       budget.mjs patch was applied and matches patch-budget.mjs exactly.
       hook-test.sh: 14/14 green against the live patched hook.
       verify.sh deep: green (build + 9 e2e tests, 3+6 as expected from
       the known smoke.spec.ts double-run).
22:51 ✓ all five planned changes confirmed live: config.yml, understand.md,
       implement.md, HARNESS.md (direct edits) + budget.mjs (user-applied
       patch). Ready to close and commit.
