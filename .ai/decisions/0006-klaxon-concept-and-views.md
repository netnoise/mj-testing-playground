# 0006 — Klaxon: from "redesign the layout" to a testing-experiments lab, with views

## Problem
The user asked for an app layout redesign, aimed loosely at "something between a
dashboard of projects and a web UI for test automation." Nothing in the repo said
what the app was *for* beyond that, so the first proposal (a "Suite Console" — a
project dashboard with a live test-run rail) was a plausible product but an
unmotivated one: nobody had said why this repo, named `mj-testing-playground`,
should exist as a thing to open on a Tuesday evening.

## Root cause
Layout was designed before purpose was. A shell can be drawn for almost any app;
drawing one first answers "what does it look like" while leaving "why does it
exist" unasked.

## Decision
Reject the dashboard framing. Adopt instead:

1. **The repo's unit of work is a planted defect, not a feature.** A test only
   proves something when it is shown to catch a real, deliberately introduced
   defect. `src/app/app.component.spec.ts:33` is the founding evidence: it fails
   on a CSS class rename (no behavior change) and passes when the `<h1>` is
   demoted to a styled `<div>` (a real accessibility regression) — inverted, and
   typical of generated or careless frontend tests.
2. **The app is frontend-first, on a modern Angular baseline**, regenerated
   fresh rather than upgraded in place — nothing in the current v14.2 NgModule
   scaffold is worth preserving, and none of standalone components, signals, the
   new control flow, or zoneless change detection exist before v15+. This is a
   dependency/toolchain change (door 1) and touches `angular.json` (door 7); not
   yet executed.
3. **The app is Klaxon**, an on-call incident board — chosen because incident
   boards are unusually hard to test well: live data, dense tables, real
   accessibility stakes (someone reads it at 3am), and forms with real
   cross-field validation.
4. **The backend is a control variable, not a product.** One real Node BFF plus
   MSW fakes behind the same contract. If the frontend test suite can tell which
   one is serving, that's implementation coupling worth finding — not a defect
   report on either backend.
5. **Findings are dogfooded, not just documented.** A `/showcase` route inside
   the running app renders the defect × test-layer matrix live, and the app's
   own UI carries an in-context callout referencing an unfixed finding (see
   Klaxon Views, below) rather than only writing the finding down separately.
6. **On-call rota is deferred**; an incident archive (paginated, not virtualized)
   replaces it in the first build, because pagination failure modes (stale page
   counts, an item vanishing off-page from a concurrent update, an unannounced
   page change) are higher-value and don't block the core loop.

## Why
- Portfolio value and "reusable pattern" value are both close to zero once code
  generation is cheap and inline — a model in the user's editor writes a
  boilerplate mock faster than anyone will ever browse this repo for one. What
  doesn't get cheaper is *judging* whether a test actually caught anything, and
  that's the scarce skill this repo is built to practice.
- The user is a frontend developer; the showcase must serve that role
  specifically (state/async at scale, forms, accessibility, performance), not a
  generic "testing across languages" survey.
- Two backend implementations of one contract deliver the "can my tests tell the
  difference" experiment that a third and fourth language (Kotlin, Go) would
  have cost in upkeep without adding to it — see the addendum below for why Go
  re-enters anyway, with a narrower job.

## Trade-off
Nothing in `src/` reflects any of this yet — the entire decision is design-level
(two written artifacts, described below) plus this record. `docs/vibe-harness.html`
and `CLAUDE.md`'s "Project" section still describe the pre-Klaxon scaffold; they
stay accurate until the Angular regeneration (item 2) actually lands, which is a
separate, door-1/door-7 run.

## Concept
**A test suite's worth is measured by what it's shown to catch, not by what it
runs.** A green suite over unplanted code is a claim with no counterfactual.
Recurs as the repo's central mechanism: every feature exists to host a defect
worth planting, and every defect gets run through every layer (unit, component,
e2e, axe, visual) with the result recorded, caught or not.

## What actually happened
Two design artifacts were produced and are the actual output of this decision,
both private Claude Artifacts (not committed as live files — the platform-specific
runtime they depend on doesn't run outside it):

- **Klaxon Testing Lab** (`https://claude.ai/artifact/XPYjDfxYcYV1UCbpDioq9r`) —
  the write-up: founding evidence, the plant/run/record mechanism, the feature
  table (incident board, triage form, incident archive, incident timeline,
  findings showcase), the backend-as-control-variable diagram, and the build
  sequence.
- **Klaxon Views** (`https://claude.ai/artifact/T8CfBzMBVpac9BCtDNfvPh`) — four
  high-fidelity wireframes (Incident Board, Triage & Escalation, Incident
  Archive, Findings) built as a linked click-through prototype.

Static, dependency-free snapshots of the four views are committed at
`docs/design/klaxon/wireframes/*.html` (plain HTML/CSS/inline SVG, openable in
any browser, no build step) so the visual reference survives independent of
artifact access. `docs/design/klaxon/README.md` indexes them and points back to
this record for the reasoning.

### Addendum — a Go service, behind the Node BFF
The user asked, after the views above shipped, to find a real use case for a Go
service sitting behind the Node BFF (Angular never talks to it directly). Two
backends (real Node BFF + MSW) already deliver the "can the frontend tell which
backend is serving" experiment from decision item 4, so Go does not re-enter as
a third *implementation of the same contract* — that would cost upkeep without
adding a new finding.

The use case that earns its own place: **the incident-event generator /
fault-injection engine that drives Klaxon's live data**, called by the Node BFF
rather than by the frontend. This is the "deliberately hostile backend" idea
from the original write-up (latency, 500s, out-of-order delivery, drifting
pagination) made concrete, and it is a genuine, idiomatic use of Go rather than
Go-for-practice:
- Many independent simulated monitors (one goroutine each) fan in incident
  events concurrently — exactly the shape Go's goroutines/channels are for, and
  notably awkward to hand-write correctly in single-threaded Node.
- It mirrors real infrastructure tooling that's written in Go for this reason
  (synthetic monitoring agents, chaos-injection tools) rather than reinventing
  a pattern that doesn't fit the language.
- It's testable in isolation with Go's own table-driven tests (a stealable
  pattern the frontend showcase can point at, honestly, since it's a technique
  comparison rather than a shipped feature).

Not yet built. This addendum records the accepted direction; scaffolding it
(module layout, its own `go.mod`, how the Node BFF calls it — HTTP or gRPC) is
future work and its own decision when it starts.
