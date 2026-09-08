# Owed

Human-owed door-7 fixes, bank cards whose own named mechanism was never built,
and orphaned `HARNESS_DOOR_OPEN` overrides — collected here instead of being
re-discovered from a journal or re-read from a bank card each time. Agent-owned:
propose an entry when you find one (`/keep`'s `mechanism:` field appends here
automatically when set); human-owned: strike an entry when it's actually applied,
don't just delete the line — a short "done, see commit" beats silent removal.

## Door-7 (needs a human edit)

- **`.claude/hooks/budget.mjs`: the Bash guard's write-verb check scans the whole
  command string, not the specific write target.** Found live three times
  (`harness-v42-r1`, `harness-v42-r2` twice) — a legitimate command gets blocked
  because it *mentions* a gate-scope filename in unrelated content (prose, a
  JSON value, a `cp` source path) while a `>`/`>>`/etc. elsewhere in the same
  command targets something else entirely. Workaround so far: split into
  separate Bash calls, or use the `Write` tool. Real fix: tie the write-verb
  match to the token immediately following it, not the whole string. Low
  urgency — always fails closed (extra friction), never fails open.
  Source: `.ai/run/harness-v42-r1/journal.md`, `.ai/run/harness-v42-r2/journal.md`.

- **`.ai/harness/verify.sh`: `deep` runs `e2e/smoke.spec.ts` twice** — once
  explicitly for the `smoke` tier's own check, once again inside `deep`'s
  unfiltered `npx playwright test`. Harmless (same 3 tests pass both times),
  costs about a second. Fix: scope `deep`'s second invocation to
  `e2e/app.spec.ts` only. Cosmetic, not urgent.
  Source: `.ai/run/harness-v42-r2/digest.md`.

## Bank cards with an unbuilt mechanism

- **`.ai/bank/2026-09-04-citation-drift.md`** names its own fix in its
  `Generalises` line: "a content hash of the cited span, not just its line
  number." `.ai/harness/check-citations.sh`'s `<!-- cite-base: <sha> -->` header
  (added `harness-v42-r3`) solves a related but different problem — a citation
  resolving against the wrong *commit* — not this one: a citation whose line
  still resolves, at the intended commit, but whose *content* silently drifted
  after the citation was written and before it was next checked. Genuinely
  still unbuilt. Would need per-citation hash storage, which is a bigger change
  than this run's scope.

## Pending human application

- **`.ai/MODEL.md`** — human-owned; the hook blocks every write to it
  regardless of override reachability. A proposed diff (current feature,
  drift section, corrected duplication count) is in
  `.ai/run/harness-v42-r3/digest.md`, not yet applied. Strike this line once
  it lands.
