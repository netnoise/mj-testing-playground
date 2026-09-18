# Klaxon — design reference

Klaxon is the working name for the app this repo is rebuilding toward: an
on-call incident board whose real purpose is to be a lab for frontend testing
technique, not a product in its own right. The reasoning that led here — why a
"redesign the layout" request ended at a testing-experiments concept instead of
a dashboard — is recorded in
[`.ai/decisions/0006-klaxon-concept-and-views.md`](../../../.ai/decisions/0006-klaxon-concept-and-views.md).
This directory holds the visual reference; that decision record holds the why.

**Nothing in `src/` reflects this yet.** These are design artifacts only — no
Angular code, no BFF, no Go service exists. The regeneration onto a modern
Angular baseline (decision 0006, item 2) is a separate, not-yet-started run.

## Write-up

[`klaxon-testing-lab.html`](klaxon-testing-lab.html) is the repo-durable copy
of the full write-up — the same content as the
[Klaxon Testing Lab](https://claude.ai/artifact/XPYjDfxYcYV1UCbpDioq9r)
artifact, open directly in a browser, no account required. It covers the
plant/run/record mechanism, the feature table, the backend-as-control-variable
diagram (now including the Go event generator — see below), the settled
decisions, the build sequence, and the doors an agent can't cross alone.

## Go event generator

Decision [`0007-go-event-generator.md`](../../../.ai/decisions/0007-go-event-generator.md)
adds a Go service behind the Node BFF: one goroutine per simulated incident
monitor, each misbehaving on its own schedule, fanning concurrently into the
event stream that makes the board's "live" data actually live. Angular never
calls it, and neither does MSW — the fake keeps faking the BFF's contract
directly, so the real path (Go &rarr; BFF) and the fake path (MSW) stay
independent of each other. Not yet built; see §05 and §06 of the write-up for
the reasoning and the diagram.

## Wireframes

Four linked, static HTML snapshots — open any of them directly in a browser,
no build step or server required:

| View | File | What it's for |
|---|---|---|
| Incident Board | [`wireframes/board.html`](wireframes/board.html) | The live table + inspector panel. Carries the colour-only-severity finding as an in-context callout, linked to Findings. |
| Triage & Escalation | [`wireframes/triage.html`](wireframes/triage.html) | The escalation dialog: real cross-field validation (escalating to Critical requires an Incident Commander) and an unsaved-changes indicator. |
| Incident Archive | [`wireframes/archive.html`](wireframes/archive.html) | The paginated long-table case, distinct from the live board's scrolling table. Annotated with what its `aria-live` region actually announces. |
| Findings | [`wireframes/findings.html`](wireframes/findings.html) | The in-app defect × test-layer matrix. Featured finding: severity-by-colour-only, caught by 0 of 5 layers. |

These are static snapshots of an interactive prototype built as a Claude
Artifact ([Klaxon Views](https://claude.ai/artifact/T8CfBzMBVpac9BCtDNfvPh)).
Both artifact links require the account that created them — the files in this
directory are the repo-durable copy and take precedence if the two ever
disagree.

## Visual language

Dark ops-console palette, chosen deliberately, not inherited:

- **Ink**: near-black with a warm-neutral bias (`#0c0d10` ground, `#14161b` /
  `#1b1e25` panels), not pure black.
- **Brand accent**: `#5b8def` (a blue distinct from every severity hue, so
  "this is Klaxon chrome" never reads as "this is urgent").
- **Severity, kept separate from the accent**: critical `#ef4444`, major
  `#f59e0b`, minor `#64748b`, resolved `#22c55e`.
- **Type**: IBM Plex Sans (UI text and headings), IBM Plex Mono (IDs,
  timestamps, anything tabular or code-shaped) — the same pairing used in the
  two write-up artifacts, for continuity across the whole project.

## Known, deliberate gap

The Incident Board's SEV badge conveys severity by colour alone. This is not
an oversight — it is the repo's first planted defect, left live in the
wireframe on purpose so the Findings view's featured claim ("nothing in this
suite catches colour-only severity") has a real thing to point at once the
app is built. Do not fix it as part of building the shell; it gets fixed only
as a recorded finding, per the harness rule in `.ai/decisions/0006`.
