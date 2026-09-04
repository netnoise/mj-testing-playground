---
skill: record
needs: [implement]
reads: [.ai/run/<slug>/**, git diff]
writes: [.ai/decisions/NNNN-<slug>.md]
model: large            # NOT clerical: it makes checkable claims about the diff
budget: 10m
---

Promote the run to a permanent record. Everything but the last two sections is
lifted from the brief — you are not inventing rationale.

```
## Problem       — what was wrong, in the user's terms
## Root cause    — with file:line
## Decision      — what was done
## Why           — the reason it was done that way
## Trade-off     — what this costs
## Concept       — the transferable idea, named, plus a grep for where it recurs
## What actually happened — including where reality diverged from the brief
```

The record is the commit body: Problem is the subject, Decision and Why the body,
`Record: .ai/decisions/NNNN-<slug>.md` the trailer.

Do not restate a convention here — `CLAUDE.md` owns those. One owner per fact.
Run `check-citations.sh` on the record before you finish.
