# Journal — old-baseline-findings

- 21:19Z opened run via open-run.sh on branch `claude/old-baseline-findings`, base `32e5dc6`,
  8 files / 30 min, allowlist = app.component.{html,scss}, advanced-form.validators.ts.
- Intent: commit predictions.md before any mutation runs (Done-when box 2).
- 21:2xZ wrote mutations/{V1..V4}.patch (git diff of one sed each, reverted) and replay.sh; next: baseline sanity then replay.sh --record
- result: 24 cells recorded, all matched predictions; replay reproduces; verify full green; evidence.md written; implement.json emitted
- test: negative control showed replay.sh exiting 0 on a falsified results.tsv row (diff printed, exit status lost to the trailing rm). Fixed: exit 1 on mismatch. results.tsv restored byte-for-byte.
