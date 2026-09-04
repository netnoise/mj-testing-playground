---
skill: digest
needs: []
reads: [.ai/run/<slug>/**]
writes: [.ai/run/<slug>/digest.md]
model: small            # assembly only - it copies claims, it does not make them
budget: 5m
---

One screen. Assemble what the run already produced; invent nothing.

```
## <title>   branch · verify <tier> ✓/✗ · <minutes> · <files> files
### One decision for you   — only if decisions_needed is non-empty. Default, cost, reversibility.
### What surprised me      — where the code contradicted a reasonable expectation
### What I learned about your system  — three cited findings, unasked for
### Concept: <name>        — the transferable idea + where it recurs
### What I did             — and what is NOT verified
```

State `unverified_at_runtime` prominently whenever nothing executed the app.
Green is not running. `verify deep` proves the build compiles, not that it boots.

If `status: completed` came back with an empty `git diff --stat`, the run did
nothing — say that instead of summarising intentions as achievements.
