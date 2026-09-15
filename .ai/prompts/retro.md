---
skill: retro
needs: []
reads: [.ai/run/<slug>/**, git diff, git log]
writes: [.ai/run/<slug>/retro.md, .ai/harness/OWED.md]
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
## Human touches       — advisory: (self-reported, so cross-check it, not a
                         blind trust) every door-7 patch you handed over for
                         application, every question you stopped and asked
                         instead of resolving yourself, and every correction
                         the human made to your work. List them, don't just
                         count them (docs/reviews/vibe-harness-v4.3-delta-
                         2026-09-10.md §1.8 - OWED.md's "no running tallies"
                         rule applies here too). Cross-checkable against
                         `ls .ai/run/<slug>/patch-*` and `door-crossings.md`.
                         None is a fine, real outcome - say so plainly.
## What actually happened      — only if it diverges from what digest.md implies.
```

Every claim here needs the same discipline as a brief: cite `file:line` or a
journal timestamp, don't reconstruct from memory. Run
`sh .ai/harness/check-citations.sh <path-to-retro.md>` before you finish, same as
`understand` and `record` — pass the path explicitly, because a standalone
directory (below) has no `state.json` and the no-argument form won't find it.

**No run for this work?** A design session or a chat still gets a retro when it was
worth one: write it to `.ai/run/<YYYY-MM-DD>-<topic>/retro.md`, the same shape as
`.ai/run/harness-v42-closeout/retro.md`. Cite what the session actually left behind —
files, commits, docs. There is no journal to cite, so say that; don't invent
timestamps to fill the gap.

**A mistake with a concrete fix goes to `.ai/harness/OWED.md`**, not just into this
file: under the door-7 section if the fix touches a gate-scope file, otherwise under
"Checks retros found missing". Same rule as `/keep`'s `mechanism:` field. A fix that
is named in a retro and then only ever re-read will recur. A mistake that is just a
lesson — no mechanism — stays here.

**This is not the digest with a different name.** The digest assembles what the
run produced; the "Mistakes" section here exists because a digest has no section
in which the agent is the subject, and a run's own errors are some of the most
useful information in it — the ui-shell-redesign retro (written by hand, before
this prompt existed) surfaced six agent-caused issues, four of which turned out
to be caused by harness mechanics, not agent judgment. That's exactly the kind of
finding a purely technical summary has no slot for.

If nothing went wrong and the harness didn't get in the way, this is a short
file. That's a fine outcome — don't pad it to look thorough.
