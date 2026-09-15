# Research: leaner harness + spec bursts for brownfield Jira work

**Date:** 2026-09-10  
**Status:** research note, not a build plan. **Superseded in part (2026-09-15)** by
`docs/reviews/harness-v44-roadmap-2026-09-15.md`, which replaces §7's backlog for this repo and
corrects four errors below: the store-mocking test lie comes from another repo, prune/diverge/attic
were never built, retro isn't in the same bucket as bank, and "two tiers" contradicts §7.2.  
**Inputs:** `docs/vibe-harness.html` (v4.2), `.ai/HARNESS.md`, `.ai/harness/config.yml`, existing skills under `.ai/prompts/`, and how this setup actually gets used: brownfield repos, Jira as the job, spec-driven habits, skills invoked in **bursts** (`intake → plan → explore → implement → review → finalize`) rather than as a full pipeline.

**How to use this at work.** Steal the keep-list and the spec shape. Treat Phase 3 / bank / prune / diverge as “not yet.” The proposed default loop is what to compare against your current Cursor/Claude setup, not a mandate to port `.ai/` wholesale.

---

## 1. Verdict

The **spine** of the current harness is sound and maps to real agentic coding:

- reversibility decides who is in the loop (doors)
- prompt rules are advisory; hooks/CI/merge are teeth
- mechanical recovery without a last LLM call (git + handoff script)
- don’t trust compile; name `unverified_at_runtime`
- self-report is not evidence (`git diff`, citation resolve, vacuous-pass checks)
- “quietly reshape the problem until the first guess looks right” is the expensive failure

What does **not** map well to how software actually gets shipped:

- unattended whole-loop as the default (pairing bursts are the dominant mode)
- digest/record/retro/bank as part of every `fix`
- five memory shelves plus CLAUDE.md
- “portable to any agent” while teeth live in `.claude/hooks/budget.mjs`
- spec-driven **product** work (Jira) folded into a code-tour `understand` brief

The useful upgrade is not more skills. It is: **one ticket-shaped spec, optional bursts, keep the brakes.**

---

## 2. What to keep (harness)

These are worth copying into a work repo even if nothing else moves.

| Idea | Why it survives contact with a real team |
|---|---|
| Doors / reversibility | Private branch; stop on deps, migrations, public contracts, weakened tests, auth/secrets, shared refs, gate-config edits |
| Door 7 | Don’t let the agent edit the thing that scores it. Symptom is a *better* metric |
| `enforced:` vs `advisory:` | Honest. A budget the model polices itself will lose under gate pressure |
| Fail-open on unexpected hook errors | A guard that bricks every edit is worse than no guard |
| Git as ledger | WIP commits on green; file lists from `git diff`, not recollection |
| Mechanical handoff | Usage limit / killed session: concatenate journal tail + `git status` + `diff --stat`. No model required |
| Runtime oracle | Production build (or equivalent), not leftover `ng serve` / unknown process |
| Vacuous pass | “Nothing failed” over zero checks; `status: completed` with no diff; hook never fired |
| Citation resolve ≠ apt | Script proves the line exists; human (or a later glance) checks it’s the right claim |
| Hypothesis / ticket falsified | First-class stop. Do not retarget `Done when` in silence |
| One owner per fact | Parallel stores drift with no error |
| `tiny` only when sure | Unsure → full ticket path. Tiny will otherwise be used to skip ceremony |

Keep `MODEL.md` only if it stays a short **present-tense map** of the living system (where state lives, test lies, module boundaries). It is not a spec and not a convention dump (`CLAUDE.md` / `AGENTS.md` owns conventions).

---

## 3. What is overkill for a work environment

| Current piece | Why it rarely pays on a team |
|---|---|
| Full `fix` flow: recall → understand → implement → test → record → retro | Ticket work is bursts. Record/retro/bank are a second product (writing + process compounding) |
| Four verify tiers (`fast` / `full` / `smoke` / `deep`) | Two oracles are the insight: cheap static, and something that boots. Extra names get skipped when latency hurts |
| Bank + attic + `/draft` + `/prune` + rule ledger | Needs volume you don’t have yet; ledger tables without data are evidence-costume |
| `/diverge` worktrees as a first-class skill | Useful a few times a year; isolation via worktrees *is* worth it for concurrent sessions |
| Digest as the human’s primary read | Learning aid. The merge door is still the **diff** + tests + runtime |
| Write-ahead journal as a rule | Compliance is advisory unless hooked; after-the-fact journals are worse than none. Git is enough for pairing |
| Claiming any-agent portability | Ideas travel (doors, verify script, git). Implementation does not (Claude Code hooks vs Cursor vs Copilot coding agent) |
| File+minute budgets as quality bounds | Useful as wander kill-switch. Brownfield often *needs* the +1 file not in the brief (second consumer). Wrong-brief + tight allowlist trains workarounds (`rm state.json` already happened here) |

**Meta risk (already paid in this repo):** the harness became the work — emits never written, state deleted to continue, docs claiming enforcement that wasn’t. A work port should start from brakes + spec file, not from reproducing `.ai/` completeness.

---

## 4. Gaps vs how you actually work

1. **Jira is intake, not `understand`.** Tickets are stale AC, two jobs in one, last-comment-wins, “also while you’re there.” A code-tour brief invents product. Intake must *quote* the ticket and rewrite AC into falsifiable `Done when`.
2. **Brownfield default is out of scope.** Without it, the agent rewrites the module. Smallest patch that meets AC; rewrite is a follow-up ticket.
3. **Bursts, not a pipeline.** `plan` only when there is a fork. `explore` only when Grounding is empty. `finalize` is PR/Jira, not a writing skill.
4. **Pairing is the default.** Unattended overnight is the special case. Durability still matters (session death), but the human’s job remains spec edits + diff review.
5. **Team doors are merge-shaped.** CODEOWNERS, required CI, secret scanning, preview, “who may bump deps.” Local `git branch -D` is not the whole reversibility story.
6. **`flows.tiny` is advisory today.** Needs a tooth (1–2 files, existing test covers it, no `Done when` change) or it will be gamed.
7. **Flakes / rebase / main moved** are the real resume problems, not missing `HANDOFF.md` prose.
8. **Test lies are repo-specific.** This playground: specs mock the store, selector bugs don’t show. Work repos have their own (snapshot sea, `toBeTruthy()`, e2e pointing at the wrong env). That belongs in `MODEL.md` / `Done when`, not in a generic digest section.

---

## 5. Proposed model: spec bursts

**One artifact per ticket:** `spec.md` on the branch (or `.ai/run/<JIRA>/spec.md`). Skills compose by reading it. No JSON bus required.

### 5.1 Suggested spec shape

```markdown
# PROJ-1234 Short title
jira: https://…/browse/PROJ-1234
branch: fix/PROJ-1234-…
burst: intake | explore | plan | implement | review | done

## Ticket
- Type: bug | story | chore
- As written: …
- Comments that change the job: …   (or none)
- Blocked on: …                     (or none)

## Done when          — testable, max 7 checkboxes. The contract.
- [ ] …

## Out of scope       — mandatory in brownfield. Default: no rewrite.
- …

## Grounding          — empty until explore (or until you already have file:line).
- Writer / readers / test lie, each with file:line

## Plan               — omit when the code forces one shape.
- Approach, rejected alternative, blast-radius paths

## Assumptions        — at most one that needs a human. Default + cost of wrong.
- …

## Doors
- none | dependency | migration | external contract | weaken test | auth | shared ref | gate config

## Falsified if
- …
```

Rules:

- `Done when` is the ticket made fail-able. If you cannot write a checkbox, intake is not done.
- Changing `Done when` / `Out of scope` mid-run is allowed and should be visible. Silently retargeting code is the failure.
- Zero human decisions is the common case. Three open questions means the ticket goes back to the author.

### 5.2 When to invoke which burst

| Situation | Bursts |
|---|---|
| Bug, repro, area known | `intake` → `implement` → `review` |
| Vague ticket or unknown area | `intake` → `explore` → (`plan` if fork) → `implement` → `review` |
| Several valid shapes / wide radius | `intake` → `explore` → `plan` → **human** → `implement` → `review` |
| Typo / one-liner, test already covers | `implement` → `verify` (no spec) |
| Session died | `resume` from **git + spec**, not from a novel |

**Never skip `intake` on a Jira ticket.**  
**Never skip `review` unless it was actually tiny.**  
**Skip `plan` when there is no fork.**  
**Skip `explore` only if Grounding can be filled in ~30s from memory *and* cited.**

`finalize`: PR title contains the key; body pastes `Done when` as test plan; link Jira; note the assumption you took. No decision-record unless the assumption is product-level and will surprise the next person.

### 5.3 Jira intake checklist (the missing skill)

1. Quote AC; don’t summarize them away. No AC → write `Done when` as interpretation and mark it assumed.
2. Read comments from the bottom; last PM comment often *is* the spec.
3. Bug vs story vs mixed. Mixed → spec names both, implement only one.
4. Linked / blocked-by issues are doors; don’t ship a workaround as the product.
5. “Fix X. Optionally Y. Consider Z.” → Y/Z in Out of scope unless explicitly pulled in.
6. If `Done when` requires a rewrite, the ticket is mis-sized: smallest patch + one sentence for a follow-up.
7. Apply this repo’s test lie: if unit tests cannot see the bug, `Done when` includes runtime or an honest `unverified_at_runtime`.

---

## 6. Skill mapping (this playground → work)

| Today (`.ai/prompts`) | Proposed | Notes |
|---|---|---|
| — | **`intake`** | New. Ticket → spec. Do not tour the repo yet. |
| `understand` | **split:** intake vs **`explore`** | Mixing them is how briefs invent product. Explore is read-only; fills Grounding + Falsified if. |
| — | **`plan`** | Only on forks. Short: approach, rejects, paths, first test. |
| `implement` | keep | Bound by spec (`Done when` + out of scope + paths). Failing check first on bugs. Self-heal: if Grounding empty, run explore first. |
| `test` | fold into implement | Don’t make it a separate default burst. |
| — / design-intent `review` | **`review`** | Against spec + diff + runtime. Not a prose digest. |
| `handoff` / `resume` | keep, thinner | Pairing: spec + git. Mechanical script only for unattended kill. |
| `digest` / `record` / `retro` / `keep` / `recall` | off default path | Optional after the fact if you want to write or tune process. |
| `adopt` / `diverge` / `prune` | later | Adopt is the hardest (conflicting existing stores). Don’t block a work port on it. |

**Default flow to ship:** `intake → implement → review`  
**Not:** `recall → understand → implement → test → record → retro`

Self-healing (keep this idea): `/implement` with no spec runs intake if a Jira key is present, else explore; `/implement` with empty Grounding runs explore then continues. Same prompt, disk is the state.

---

## 7. Potential improvements — backlog

Split so a work port can pick **harness** (repo-agnostic brakes) vs **skills** (how agents are invoked) independently.

### 7.1 General harness (any brownfield repo)

**Do first**

- [ ] One agent-facing page (`AGENTS.md` / `CLAUDE.md` / slim `HARNESS.md`): doors, two verify tiers, never-trust list, where `spec.md` lives. Essay HTML is non-normative.
- [ ] Two verify contracts only: **fast** (lint + unit) and **runtime** (real app or prod build, not a mystery leftover server). Map existing `smoke`/`deep` down if you port.
- [ ] Door 7 (or equivalent): CI config, coverage globs, gate scripts are human-owned; agent proposes a patch.
- [ ] Tiny-flow tooth: path/file cap + “existing test covers it” + no AC change; otherwise not tiny.
- [ ] Branch named after ticket; commit with explicit pathspec (concurrent session hazard is real).
- [ ] PR template = paste `Done when`. That *is* finalize.

**Do when you actually run longer / unattended**

- [ ] Mechanical handoff on stop (no model).
- [ ] Hook: don’t weaken/delete tests; don’t touch secrets/auth paths; don’t push shared refs.
- [ ] Fail-open + hook self-test with a negative control (hook can fire and still be wrong).
- [ ] Citation check on `spec.md` (resolve, print the line).

**Don’t start with**

- [ ] Bank / attic / weekly prune / rule ledger
- [ ] Digest as required output
- [ ] Four-tier verify names
- [ ] Model-routing as a measured ledger (needs data; self-reported tokens are costume)
- [ ] Full `/adopt` of a 780-line failure log into a new store — point at the existing log instead (one owner)

### 7.2 Repo / project skills

**Do first**

- [ ] Add `/intake <JIRA>` (or “paste ticket”). Output only the spec header + Done when + Out of scope + Assumptions.
- [ ] Split current `understand` into explore (code, cited) vs intake (ticket).
- [ ] Change default `fix` (or Cursor skill chain) to `intake → implement → review`; make explore/plan explicit invocations.
- [ ] `/review` checklist: every checkbox; diff vs out of scope; runtime ran or flagged; no weakened tests.
- [ ] Repo `MODEL.md` (≤2 pages): architecture now, **test lies**, where not to “clean up.”
- [ ] Encode this repo’s gotcha as a skill note, not a bank ritual: *mock at the boundary you don’t own.*

**Project-specific (this playground, as a template for work apps)**

- [ ] NgRx: who writes the slice vs who reads it; effects that secretly feed a second view.
- [ ] Playwright (or equivalent) against what `npm run build` produces for UI `Done when`.
- [ ] Angular routing/smoke: “every route mounts” as the cheap runtime net; feature e2e only at hand-back if the suite is brittle on copy.

**Cursor / Claude skill wiring (work machine)**

- [ ] Prefer a small set of slash skills that match bursts, not 13 always-on prompts.
- [ ] Stable prefix: repo `AGENTS.md` + `MODEL.md` first; ticket spec after (cache hygiene without a two-page religion).
- [ ] Subagents: use *explore* as read-only isolated context; don’t give it write. Filesystem spec still wins over a rich emit JSON.
- [ ] Don’t duplicate Jira in a second tracker. The spec quotes Jira; Jira remains the system of record for status.

**Later, if volume exists**

- [ ] Optional `/keep` for failures you would otherwise delete with the spike branch.
- [ ] Optional plan burst with worktrees when you truly want three spikes.
- [ ] Eval set: 3–5 frozen tasks (“fix X, must not touch Y, fail if runtime skipped”) so the harness cannot regress silently.

---

## 8. Lightweight test (whether a work port is healthy)

You should only:

1. Point at a Jira key (or paste the ticket).
2. Edit `Done when` / `Out of scope` / one assumption when the agent got the product wrong.
3. Read the diff and the runtime result (or the explicit unverified flag).

If you are picking bank cards, striking OWED, or reading a four-section digest to *replace* the diff, the port has grown back into the lab OS.

---

## 9. Suggested reading order in this repo

1. `.ai/HARNESS.md` — what the agent actually loads (normative today).
2. This note — what to change if the goal is work-shaped Jira bursts.
3. `docs/vibe-harness.html` — incident folklore and why the brakes exist (non-normative).
4. `docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md` — claims vs disk; why “enforced” must stay true.

---

## 10. One-line summary

**Keep doors, git, runtime, and honest enforcement. Replace the default skill chain with a Jira-shaped spec and optional bursts. Treat memory/compounding skills as a personal writing system, not as the way a brownfield ticket gets done.**
