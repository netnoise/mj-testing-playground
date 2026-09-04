---
skill: test
needs: [understand]
reads: [.ai/run/<slug>/brief.md, src/**]
writes: ["src/**/*.spec.ts", .ai/run/<slug>/test.json]
model: large
budget: 30m
stop_on: [enforced: blast_radius_exceeded, advisory: cannot_express_the_invariant]
---

Turn the brief's hypothesis into assertions.

- **Bug:** the failing spec lands first and you show it failing. A fix without a
  test that failed before it is unverified.
- **Feature:** each spec names the invariant it protects in its own `it(...)` text.
- Gate on *changed lines covered*, never a global coverage number. A repo at 4%
  will never reach 80%, so that target gets disabled and takes the harness with it.

**A passing test is not evidence.** Before you finish, read your own test diff
and ask of each spec: what would have to break for this to fail? The repo's own
`src/app/app.component.spec.ts:20` is `expect(app).toBeTruthy()` — it passes,
looks like diligence, and verifies nothing. Report vacuous specs in `test.json`
as `vacuous: N`; zero specs added is `vacuous: null`, never a pass.

Never weaken, skip, or delete an existing test to get green — door 4. Never widen
or narrow a config that defines what the gate measures — door 7.
