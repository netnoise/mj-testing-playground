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
the reasoning and the diagram. Per decision 0008 it comes **after** the first
measured frontend finding and the scripted-fake scenarios, not before them
(write-up §07).

## Wireframes

Four linked, static HTML snapshots — open any of them directly in a browser,
no build step or server required:

| View | File | What it's for |
|---|---|---|
| Incident Board | [`wireframes/board.html`](wireframes/board.html) | The live table + inspector panel. Carries an in-context callout for the planned colour-only-severity mutation, linked to Findings. The markup here is a prototype (all divs, fixed widths, 10px labels): take its hierarchy and type, not its structure. |
| Triage & Escalation | [`wireframes/triage.html`](wireframes/triage.html) | The escalation dialog: real cross-field validation (escalating to Critical requires an Incident Commander) and an unsaved-changes indicator. |
| Incident Archive | [`wireframes/archive.html`](wireframes/archive.html) | The paginated long-table case, distinct from the live board's scrolling table. Annotated with what its `aria-live` region actually announces. |
| Findings | [`wireframes/findings.html`](wireframes/findings.html) | The in-app defect × test-layer matrix. Featured row: severity-by-colour-only, a hypothesis (predicted 0 of 5, not run). |

These are static snapshots of an interactive prototype built as a Claude
Artifact ([Klaxon Views](https://claude.ai/artifact/T8CfBzMBVpac9BCtDNfvPh)).
Both artifact links require the account that created them — the files in this
directory are the repo-durable copy and take precedence if the two ever
disagree. As of decision 0008 (2026-09-18) they do: the artifacts still show
the uncorrected claims.

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

## Planned mutation: colour-only severity

Earlier versions of this README said the board's SEV badge conveys severity by
colour alone. It doesn't: every badge in `wireframes/board.html` carries
visible text (`CRIT`, `MAJ`, `MIN`, and `CRITICAL` in the inspector). Decision
[`0008`](../../../.ai/decisions/0008-klaxon-claims-to-hypotheses.md) corrects
this.

The normal app ships **accessible severity labels**. Colour-only severity is an
**isolated mutation**: a patch that strips the badge text, applied to a frozen
suite, run, recorded, and reverted. The inaccessible version is never the
default. Whether that mutation is caught depends on the assertions the suite
actually makes. The prediction that it's "caught by 0 of 5" is a hypothesis
until it has been run.

## Claims and evidence

Every test outcome in these docs is either **recorded** or a **hypothesis**. The
status vocabulary is `hypothesis · caught · missed · not run · not applicable ·
infrastructure error`. A result counts only when it names its baseline commit,
mutation patch, test revision, command, scenario or seed, environment, and
failure output. Today there is exactly one recorded result: the heading-demotion
run against the existing `app.component.spec.ts` (write-up §01, evidence in
`.ai/run/klaxon-claims-correction/evidence.md`).
