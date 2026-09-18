# HANDOFF - klaxon-regen-shell
generated mechanically 2026-09-18T22:28:11Z - no model call

> **ACTIVE - mid-run snapshot, not a final state.** This run is still
> in progress; the Stop hook wrote this automatically, it wasn't
> requested. Expected during an active run - do not delete it, and
> don't read it as evidence the run ended here.

## Goal
# The scaffold is Angular 14 and the Klaxon milestone can't start until a modern, green shell exists
run: klaxon-regen-shell · intake 2026-09-18

## Journal tail
```
# Journal — klaxon-regen-shell

- opened via open-run.sh on branch claude/klaxon-regen-shell from master 3932df7, type redesign, 40 files / 90 min.
- allowlist adds e2e/app.spec.ts (door-4 deletion, approved) beyond the brief list, so the deletion is an allowed Edit-path, not a Bash bypass.
- door-crossings.md written first (pre-disclosure of the door-7 files).
- plan: build the full tree in a scratch clone, verify there, export door-7 files as a patch; apply everything else in the repo.
- built the full tree in a scratch clone; lint/jest/build/verify deep green there; V1-V4 vs ported validators spec: V1 caught, V2-V4 missed (matches old-baseline).
- applied the non-gate part to the repo (src, public, package*.json, e2e smoke, .storybook removal, CLAUDE.md); door-7 part exported to patch/gate-scope.patch (8 files).
- deferred: @testing-library/dom (brief listed it; unused until run 2, so added there, not here).
- STOP: door 7 needs the human to apply patch/gate-scope.patch and commit; branch is red until then (angular.json still Angular 14).
- deviation: brief said ESLint 9; `ng add angular-eslint` in the scratch clone bumped package.json to eslint ^10.3.0 (lock 10.11.0) and every gate in the clone passed on it. Kept; docs corrected to ESLint 10. Digest must name it.
```

## Tree state (git is the truth, not any claim above)
```
branch: claude/klaxon-regen-shell  head: 543eda7
 M .ai/run/klaxon-regen-shell/HANDOFF.md
 M package-lock.json
?? .ai/run/2026-09-15-landing-page/
?? .ai/run/2026-09-18-next-development-step/
?? .ai/run/harness-v42-landing/HANDOFF.md
?? .ai/run/harness-v43-critical/HANDOFF.md
?? .ai/run/hotfix-gate-and-claims/HANDOFF.md
--
 .ai/run/klaxon-regen-shell/HANDOFF.md | 75 +++--------------------------------
 package-lock.json                     |  1 +
 2 files changed, 6 insertions(+), 70 deletions(-)
```

## Last emit
```
{
  "skill": "implement",
  "status": "ok",
  "at": "2026-09-18T22:02:39.969Z",
  "base_commit": "3932df75c94b3049cf18e8382f0bf7caea29f27a",
  "artifacts": [
    "PATCH-NOTES.md",
    "brief.md",
    "door-crossings.md",
    "input.md",
    "journal.md",
    "understand.json"
  ],
  "files_changed": [
    ".storybook/main.js",
    ".storybook/preview.js",
    ".storybook/tsconfig.json",
    "CLAUDE.md",
    "e2e/app.spec.ts",
    "e2e/smoke-routes.ts",
    "e2e/smoke.spec.ts",
    "package-lock.json",
    "package.json",
    "public/favicon.ico",
    "src/app/advanced-form/advanced-form.component.html",
    "src/app/advanced-form/advanced-form.component.scss",
    "src/app/advanced-form/advanced-form.component.spec.ts",
    "src/app/advanced-form/advanced-form.component.ts",
    "src/app/advanced-form/advanced-form.validators.spec.ts",
    "src/app/app.component.html",
    "src/app/app.component.spec.ts",
    "src/app/app.component.stories.ts",
    "src/app/app.component.ts",
    "src/app/app.config.ts",
    "src/app/app.html",
    "src/app/app.module.ts",
    "src/app/app.routes.ts",
    "src/app/app.scss",
    "src/app/app.ts",
    "src/app/board/board.html",
    "src/app/board/board.scss",
    "src/app/board/board.ts",
    "src/app/smoke-routes.spec.ts",
    "src/environments/environment.prod.ts",
    "src/environments/environment.ts",
    "src/favicon.ico",
    "src/main.ts",
    "src/polyfills.ts"
  ],
  "spent": {
    "min": 5,
    "files": 34
  }
}
```

## Resume
```
git checkout claude/klaxon-regen-shell && /resume klaxon-regen-shell
```

> A clean exit is not evidence of work. Diff the tree before believing
> anything the journal claims.
