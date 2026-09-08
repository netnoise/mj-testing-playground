---
skill: retro
needs: []
reads: [.ai/run/<slug>/**, git diff, git log]
writes: [.ai/run/<slug>/retro.md]
model: large            # not clerical - it has to notice its own mistakes accurately
budget: 15m
---

Process critique, not a technical summary. `digest.md` already covers what
surprised you about *the code*; this is what you got wrong, or what the harness
made harder than it should have been. Written for the human's review, in the
first person, plainly — no spin, no self-flagellation either.

```
## Verdict            — one or two sentences. Did this take about the effort the
                         task warranted? If not, say by roughly how much and why.
## Mistakes            — yours specifically. What you'd do differently, not what
                         went wrong in general. A run with none is rare; say so
                         if it's genuinely true, don't manufacture one to fill
                         the section.
## What the harness made harder than the task needed
## What actually happened      — only if it diverges from what digest.md implies.
```

Every claim here needs the same discipline as a brief: cite `file:line` or a
journal timestamp, don't reconstruct from memory. Run
`sh .ai/harness/check-citations.sh` before you finish, same as `understand` and
`record`.

**This is not the digest with a different name.** The digest assembles what the
run produced; the "Mistakes" section here exists because a digest has no section
in which the agent is the subject, and a run's own errors are some of the most
useful information in it — the ui-shell-redesign retro (written by hand, before
this prompt existed) surfaced six agent-caused issues, four of which turned out
to be caused by harness mechanics, not agent judgment. That's exactly the kind of
finding a purely technical summary has no slot for.

If nothing went wrong and the harness didn't get in the way, this is a short
file. That's a fine outcome — don't pad it to look thorough.
