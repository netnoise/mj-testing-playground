# MjTestingPlayground

An Angular 14 application. Commands, code conventions and the toolchain are
owned by `CLAUDE.md` — read that first; nothing here restates them.

## AI harness

This repo carries a small, portable harness for working with coding agents:
plain markdown plus a handful of shell scripts, no dependencies.

- `docs/vibe-harness.html` — the design, and why each piece exists
- `.ai/HARNESS.md` — the one-page rules an agent reads
- `.ai/harness/verify.sh [fast|full|smoke|deep]` — the only gate contract

## Testing

- `docs/testing-techniques.md` — a catalog of testing techniques, each with a
  verdict for this repo (including the ones that don't apply, and why)
- `docs/testing-roadmap.md` — the phased plan for adopting them

It is tool-agnostic: `CLAUDE.md` and `AGENTS.md` are three-line pointers at
`.ai/`, so switching agents is a one-file change.
