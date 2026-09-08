# HANDOFF - harness-v42-budgets
generated mechanically 2026-09-08T20:25:11Z - no model call

## Goal
(no brief)

## Journal tail
```
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
```

## Tree state (git is the truth, not any claim above)
```
branch: harness/v4.2-remediation  head: 6fbe3a3
 M .ai/HARNESS.md
 M .ai/harness/config.yml
 M .ai/prompts/implement.md
 M .ai/prompts/understand.md
?? .ai/run/harness-v42-budgets/
?? .ai/run/harness-v42-r2/commit-msg.txt
--
 .ai/HARNESS.md            | 26 ++++++++++++++++++--------
 .ai/harness/config.yml    |  8 ++++++--
 .ai/prompts/implement.md  |  8 ++++++--
 .ai/prompts/understand.md |  4 +++-
 4 files changed, 33 insertions(+), 13 deletions(-)
```

## Last emit
```
{
  "status": "active",
  "allowed_paths": [
    ".ai/harness/config.yml",
    ".claude/hooks/budget.mjs",
    ".ai/prompts/understand.md",
    ".ai/prompts/implement.md",
    ".ai/HARNESS.md",
    ".ai/run/harness-v42-budgets/**"
  ],
  "max_files": 12,
  "max_minutes": 45,
  "files_touched": [
    ".ai/HARNESS.md",
    ".ai/harness/config.yml",
    ".ai/prompts/implement.md",
    ".ai/prompts/understand.md",
    ".ai/run/harness-v42-budgets/journal.md",
    ".ai/run/harness-v42-budgets/patch-budget.mjs",
    ".ai/run/harness-v42-budgets/state.json",
    ".ai/run/harness-v42-r2/commit-msg.txt"
  ],
  "started_at": "2026-09-08T22:30:00Z"
}
```

## Resume
```
git checkout harness/v4.2-remediation && /resume harness-v42-budgets
```

> A clean exit is not evidence of work. Diff the tree before believing
> anything the journal claims.
