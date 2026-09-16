# Journal — harness-v42-r2

Executing R2 of docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md's plan
(.claude/plans/cuddly-launching-snowglobe.md): make green mean something.
Deep target decision: zero-dependency node static server over dist/.
playwright.config.ts and jest.config.js are door-7 (human) - delivered as a
batched patch, not committed by the agent.

18:32 ! correction to R1's digest: the .claude/settings.json Bash-matcher
       change did NOT need a session restart - confirmed live here. The
       very first Bash call of this run (a plain heredoc creating this
       run's own state.json) was intercepted by the Bash-guard path in
       budget.mjs, which only exists because the matcher now includes
       Bash. R1's claim ("not verified... requires restart") was wrong;
       correcting it here rather than editing R1's already-committed
       digest. HARNESS.md's "changed hook/prompt/command files need a
       restart" rule evidently doesn't apply to settings.json's own hook
       registration the way it applies to .ai/prompts/*.md - worth a
       precise statement of which files that rule actually covers.
18:33 ! second false-positive shape in the Bash guard, found live: a
       legitimate state.json needing to list a gate-scope path
       (.ai/harness/verify.sh) inside its own allowed_paths array trips
       the needle scan when written via a `cat > file <<EOF` heredoc,
       because the JSON content merely *mentions* the filename as data,
       not as a write target. Worked around by using the Write tool
       instead of Bash for this file (creation of a new state.json is
       correctly unguarded either way). Not fixing budget.mjs mid-R2
       (out of this run's declared scope) - noted for a future pass:
       tie the write-verb match to the token immediately following it,
       not the whole command string. Two real instances now (R1 and R2),
       upgrades this from a hypothetical to a pattern worth fixing.
