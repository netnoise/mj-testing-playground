# 0004 — Vehicle brand/model selection

## Problem
The repo had no domain code — a near-default scaffold — and the harness's
own design page had been using "vehicle brand → models" as an illustrative
example throughout without a real implementation to check the example
against.

## Root cause
N/A — this is new feature work, not a fix.

## Decision
`VehicleService` exposes `models$` derived from a `BehaviorSubject<brand>`
via a static lookup; `BrandSelectComponent` and `ModelListComponent` are the
only UI. Zero new dependencies — the brief's falsification condition
("if the brand/model relationship needs anything `combineLatest` + a
`BehaviorSubject` can't express, a real state library is warranted") was
never tripped.

## Why
This is genuinely the smallest thing that demonstrates real derived state:
one owner (the service) computing a value from a single piece of state,
consumed read-only by two dumb components. Anything smaller wouldn't be
derived state; anything larger wasn't needed.

## Trade-off
An unrecognized or unselected brand renders identically (empty state) — see
the digest's one open decision. Correct for a closed set of known brands via
a `<select>`; would need re-examining if free-text brand entry is ever added.

## Concept
**An empty array is one state, not two.** "Nothing selected" and "selected,
no results" collapsed into a single template branch because both are just
`[]` to the component. Cheaper, and impossible to get out of sync — at the
cost of the UI being unable to distinguish them if that ever matters.

## What actually happened
Genuine failing-first for both components: their specs were written and
`npx jest` confirmed them red on "Cannot find module" before any
implementation existed, then green (8/8, later 11/11 with the existing
suite) once `BrandSelectComponent` and `ModelListComponent` were written.
The service itself was implemented before its own spec — a deviation from
failing-first, logged rather than glossed
(`.ai/run/vehicle-selection/journal.md:3`).

Blast radius was enforced *live* by the hook for the first time this
session: `.ai/run/vehicle-selection/state.json`'s `files_touched` list is
the hook's own record of every file it approved, not a self-report.

`verify deep` — build plus a real Playwright run — passed with the actual
feature behavior exercised: selecting "Toyota" in a real browser and
confirming "Corolla" becomes visible. This is the first feature in this
repo's history verified that way rather than merely compiled.
EOF
grep -oE '\.?[A-Za-z0-9_][A-Za-z0-9_./-]*\.[A-Za-z]+:[0-9]+' /home/user/mj-testing-playground/.ai/decisions/0004-vehicle-selection.md