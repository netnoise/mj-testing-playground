# 0007 — Go re-enters as the incident-event generator, behind the BFF

## Problem
Decision 0006 ruled Go out: a third implementation of the incident-CRUD
contract (alongside the real Node BFF and MSW) would cost upkeep without
producing a new finding, since the BFF/MSW pair already answers "can the
frontend tell which backend is serving." The user then asked, in a follow-up
turn, to find a real use case for Go specifically *behind* the Node BFF —
not as a peer to it.

## Root cause
0006's Go verdict answered a narrower question ("should Go implement the
same contract a third time?") than the one actually asked ("does Go have any
job here at all?"). Those are different questions with different answers.

## Decision
Go's job is the **incident-event generator and fault-injection engine** that
feeds the Node BFF live data — the "deliberately hostile backend" idea from
the original write-up, made concrete:

- One goroutine per simulated monitor, each misbehaving on its own schedule
  (flapping, going silent, emitting duplicates), fanning concurrently into
  one event stream.
- Called only by the Node BFF. Angular never talks to it, and neither does
  MSW — MSW keeps faking the BFF's contract directly, so the two backend
  paths (real: Go &rarr; BFF; fake: MSW) stay genuinely independent of each
  other, not just independently deployed.
- Tested in isolation with Go's own table-driven tests, which the frontend
  showcase can cite as an honest technique comparison rather than a shipped
  feature.

Both write-up artifacts were updated to match (Klaxon Testing Lab
`https://claude.ai/artifact/XPYjDfxYcYV1UCbpDioq9r`, now at version 3): a new
diagram in §05 showing the generator feeding the BFF with MSW drawn outside
that arrow, a new "Event generator" row in §06's decision table, a new step 3
in §07's build sequence, and door 1 in §08 extended to name the Go module. A
repo-durable static copy is committed at
[`docs/design/klaxon/klaxon-testing-lab.html`](../../docs/design/klaxon/klaxon-testing-lab.html),
same reasoning as the wireframe snapshots in 0006: the artifact link requires
the owning account, the committed file doesn't.

## Why
Goroutines/channels are the right shape for "many independent things, each on
their own clock, fanning into one stream" — genuinely more awkward to get
right in single-threaded Node. It also mirrors real infrastructure tooling
(synthetic-monitoring agents, chaos-injection tools) that's written in Go for
the same concurrency reason, so it reads as an idiomatic choice rather than
Go-for-practice grafted onto an unrelated job.

## Trade-off
The repo now has a third toolchain to keep green (Go, alongside Angular/Jest
and the Node BFF), none of it built yet. Nothing in `src/` or a new top-level
service directory reflects this decision — it is still design-only, same as
0006. Scaffolding it (module layout, `go.mod`, HTTP vs gRPC to the BFF) is
future work and crosses door 1 when it starts.

## Concept
**A ruled-out technology and a ruled-out job are not the same ruling.**
0006's "Go adds near-zero value" was true of "Go as a second contract
implementation" and false of "Go as a concurrent event source" — the same
language, two different jobs, two different verdicts. Re-litigating the
verdict without separating the job would have either wrongly kept Go out
entirely or wrongly walked back the original (still correct) reason it was
ruled out of the contract role.

## What actually happened
Chat-only turn: the artifact was edited and republished (version 3), this
record and the write-up snapshot were added, and `docs/design/klaxon/README.md`
was updated to list it. `docs/**` and `.ai/decisions/**` are both outside
`GATE_SCOPE`, so this is a doors-free, docs-only commit — no `verify.sh` tier
applies.
