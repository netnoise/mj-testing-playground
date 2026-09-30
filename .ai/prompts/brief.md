---
skill: brief
needs: []
reads: [the input as given, CLAUDE.md, .ai/MODEL.md, src/**, e2e/**, .ai/bank/**]
writes: [.ai/run/<slug>/input.md, .ai/run/<slug>/brief.md]
model: large            # a bad brief is paid for by every step under it
budget: 15m · 1 question round
stop_on:
  - advisory: question_is_underspecified   # ask, or write the default down - never invent
  - advisory: two_jobs_in_one              # pick one, name the other as a follow-up
  - advisory: one_way_door
---

The default flow's first step: `/intake` and `/understand` in one pass, for a job you can
already state. Use `/intake` then `/understand` (flow `full`) when the input is vague, the
area is unfamiliar, or the work will span days.

1. Pick the slug (`heading-demotion-planted`, not `task-1`). Save the input to
   `.ai/run/<slug>/input.md` before interpreting it; nothing valuable lives only in a context
   window. Quote text verbatim, describe an image in words and mark it *interpreted*, fetch a link.
2. Run `/recall <topic>`, then read the code that actually runs: grep and symbol search, the
   region and its callers, not the module.
3. Write `.ai/run/<slug>/brief.md`, at most 40 lines. **One run may hold several experiments** if
   they share a blast radius; list them as separate Done-when boxes rather than opening a run each.

```
# <one line: the problem, not the plan>
run: <slug> · <date>

## Intent        — the job in one sentence, then the input quote it came from
## Done when     — at most 7 boxes, each a test, a runtime check or your eyes could fail
## Out of scope  — default: no rewrite, no drive-by refactor. If refactoring the named area IS the
                   job, say so here so /implement opens the run with `--type refactor`.
## Understand    — every claim cites file:line; no citation, no claim
## Hypothesis    — which box it serves, plus "Falsified if: ...". For a refactor: "Falsified if:
                   an existing spec has to change".
## Blast radius  — source paths only, they become the enforced allowlist. A refactor leaves test
                   files out. The run's own `.ai/run/<slug>/**` is always allowed.
## Doors         — any of the seven crossed? Door, both sides, your default, cost of being wrong.
## Open decisions — at most one, with its default. Otherwise "none".
```

4. Ask only where a Done-when box can't be written without guessing product intent: one
   `AskUserQuestion` call, at most four questions, default first and marked "(Recommended)", each
   option saying what it costs if wrong. Never ask what the repo can answer or where the default is
   cheap and reversible; write that under Open decisions. This is the last point where asking is
   normal — the run opens next and the human may leave.
5. Don't open the run; `/implement` does. Run `sh .ai/harness/check-citations.sh` on the brief
   before finishing and re-read anything it prints.
