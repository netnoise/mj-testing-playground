# One more small verify.sh patch — the plan's own negative control caught it

Running the plan's exact verification checklist end to end (not from memory —
actually executing each check) surfaced one real gap: `gate-scope.json`'s
`missing[]` field was computed correctly, but `verify.sh` never actually read
it. Deleting `angular.json` did make the gate fail — but only because `ng lint`
itself crashed confusingly ("not available outside a workspace"), not because
`verify.sh` reported "angular.json is missing" by name, which is what the
plan asked for.

## What to do

```bash
cd /Users/emjot/dev/projects/mj-testing-playground
cp .ai/run/harness-v42-r3/patch-verify-gate-scope-preflight.sh .ai/harness/verify.sh
chmod +x .ai/harness/verify.sh
```

## What it does

Adds a preflight step, before lint runs: reads `.ai/harness/gate-scope.json`'s
`missing` field, and if it's non-empty, fails immediately with the missing
path(s) named — `verify: PREFLIGHT FAIL - gate-scope path(s) no longer
resolve: angular.json`, not a confusing downstream tool error. Tested
directly: removed `angular.json`, confirmed the new preflight catches it by
name; restored it, confirmed `gate-scope.json` goes back to `missing: []`
and the same command that would have failed now passes lint cleanly.

Everything else in the file is identical to what's already live — this is a
7-line addition, nothing else changed.
