---
skill: test
needs: [understand]      # flow `full` only; the default flow folds this into implement
reads: [.ai/run/<slug>/brief.md, src/**]
writes: ["src/**/*.spec.ts"]
model: large
budget: 30m
stop_on: [enforced: blast_radius_exceeded, advisory: cannot_express_the_invariant]
---

Turn the brief's hypothesis into assertions.

- **Bug:** the failing spec lands first and you show it failing. A fix without a
  test that failed before it is unverified.
- **Feature:** each spec names the invariant it protects in its own `it(...)` text.
- **Refactor:** the existing specs *are* the assertion — you do not write new ones.
  The brief's Blast radius should already exclude test files (`.ai/HARNESS.md`); if a
  spec genuinely needs to change, the change wasn't behaviour-preserving. Stop and say
  so under `hypothesis_falsified` rather than editing it — `close-run.sh` will refuse
  to close the run on a touched spec anyway (door 4's first real tooth).
- Gate on *changed lines covered*, never a global coverage number. A repo at 4%
  will never reach 80%, so that target gets disabled and takes the harness with it.

**A passing test is not evidence.** Before you finish, read your own test diff
and ask of each spec: what would have to break for this to fail? An
`expect(app).toBeTruthy()` spec passes, looks like diligence, and verifies nothing.
Say in the journal how many specs are vacuous; zero specs added is never a pass —
**except for a refactor**, where it is the correct outcome.

Never weaken, skip, or delete an existing test to get green — door 4. Never widen
or narrow a config that defines what the gate measures — door 7.
