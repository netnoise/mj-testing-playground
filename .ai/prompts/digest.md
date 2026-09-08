---
skill: digest
needs: []
reads: [.ai/run/<slug>/**]
writes: [.ai/run/<slug>/digest.md]
model: large   # not clerical for the whole skill: "One decision for you" states a
               # default, a cost, and a reversibility judgment - synthesis across
               # emits, not concatenation of them - and there is no downstream of
               # the digest to catch a wrong cost-of-wrong. The rest of the
               # template genuinely is assembly; routed as one skill anyway since
               # frontmatter only carries one model per prompt.
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
### What I got wrong       — only if something is worth naming. See below.
```

**"What I got wrong"** is the one section where you are the subject, not the code.
A mistake you caught and fixed still belongs here — silently fixing it and saying
nothing is indistinguishable from never having made it, and that's the gap
`/retro` exists to close when it's worth more than a paragraph. Most runs: one or
two sentences, or omit the section entirely if genuinely nothing qualifies — don't
manufacture a mistake to fill it, and don't let this become a confessional that
crowds out the technical sections above it. If there's enough here that it needs
its own document, say so and suggest `/retro` rather than writing it all here.

State `unverified_at_runtime` prominently whenever nothing executed the app.
Green is not running. `verify deep` proves the build compiles, not that it boots.

If `status: completed` came back with an empty `git diff --stat`, the run did
nothing — say that instead of summarising intentions as achievements.
