# Journal — klaxon-regen-shell

- opened via open-run.sh on branch claude/klaxon-regen-shell from master 3932df7, type redesign, 40 files / 90 min.
- allowlist adds e2e/app.spec.ts (door-4 deletion, approved) beyond the brief list, so the deletion is an allowed Edit-path, not a Bash bypass.
- door-crossings.md written first (pre-disclosure of the door-7 files).
- plan: build the full tree in a scratch clone, verify there, export door-7 files as a patch; apply everything else in the repo.
- built the full tree in a scratch clone; lint/jest/build/verify deep green there; V1-V4 vs ported validators spec: V1 caught, V2-V4 missed (matches old-baseline).
- applied the non-gate part to the repo (src, public, package*.json, e2e smoke, .storybook removal, CLAUDE.md); door-7 part exported to patch/gate-scope.patch (8 files).
- deferred: @testing-library/dom (brief listed it; unused until run 2, so added there, not here).
- STOP: door 7 needs the human to apply patch/gate-scope.patch and commit; branch is red until then (angular.json still Angular 14).
