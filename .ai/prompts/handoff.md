---
skill: handoff
needs: []
reads: [.ai/run/<slug>/**, git]
writes: [.ai/run/<slug>/HANDOFF.md]
model: small
budget: 3m
---

Write for a cold agent with zero context.

First run `sh .ai/harness/handoff.sh <slug>` — it needs no model at all, which is
the point: at a usage limit you cannot call anything to summarise. That file is
the floor. Improve it if you still can:

- **Goal** — one line, plus the brief path
- **Done** — only what `git diff` and a green verify support
- **In flight** — what was mid-step, and whether re-running it is safe
- **Next** — numbered
- **Open decision** — if any
- **Traps** — what would mislead a fresh reader
- **Resume** — the literal command

Never write "completed" for work you cannot see in the diff.
