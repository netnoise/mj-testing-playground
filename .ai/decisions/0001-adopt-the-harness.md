# 0001 — Adopt the .ai harness

## Problem
Agent work in this repo left nothing behind: no record of why a change was made, no
way to resume after an interruption, and no mechanism stopping an agent from editing
the thing that measures it.

## Root cause
Everything of value lived in a context window. `CLAUDE.md:21` held conventions, but
nothing held reasoning, run state, or enforcement.

## Decision
Phase 0 + 1 of the harness: seven doors, tiered `verify.sh`, a write-ahead journal, a
mechanical handoff needing no model call, nine prompts, a curated bank, and a
`PreToolUse` hook that enforces door 7 and the budgets.

## Why
A review from a repo that had already run agents unattended for two weeks (TriTrack,
108 commits, 780-line failure log) showed that every prompt-level constraint had
failed under gate pressure, while its single hook-enforced constraint held. So the
budget lives in a hook over `state.json`, and the frontmatter only declares it.

## Trade-off
33 files against a repo with one component. Justified only if the design travels to
other repos — which is what `.ai/` plus three-line adapters is for. If it never
leaves this repo it was not worth it.

## Concept
**The measuring instrument is not the measurement.** Door 7 blocks edits to the config
defining a gate's own scope, because that failure's symptom is a *better* number and
no gate can see it. Recurs at `karma.conf.js`, `angular.json:83`, `tslint.json`.

## What actually happened
Two things changed under me. `check-citations.sh`, written to catch fabricated
`file:line`, instead caught three *miscited* lines in my own brief on its first run —
it proves resolution, not aptness, and the difference is worth knowing. And
`.ai/conventions.md` was deleted from the plan mid-build once it was clear it would
duplicate `CLAUDE.md` on day one.

Neither `verify.sh` nor the hook has been exercised end to end: the Angular 9
toolchain will not install on Node 22, and hook files are not live in the session that
writes them. Both are stated in the digest rather than glossed.
