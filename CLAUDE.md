# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Angular 14 testing playground (`mj-testing-playground`): NgModule-based, `@angular/core` ~14.3 with CLI 14.2. Current code is a root `AppComponent` (header plus `<router-outlet>`), an `AppRoutingModule` with one route (`advanced-form` → `AdvancedFormComponent`, and `''` redirects to it), and that form's validators and specs, which are the only real logic.

The planned direction, **Klaxon** (an on-call incident board that hosts planted defects for testing experiments), is design only: see `docs/design/klaxon/` and decisions `.ai/decisions/0006`–`0008`. Nothing in `src/` implements it, and it is planned as a regeneration on a newer Angular, not an extension of this scaffold. Keep changes to the current app small, and generate via `ng generate` rather than building parallel structures.

## Commands

All commands run via the local Angular CLI (`npx ng …` or the npm scripts below).

- `npm start` — dev server at http://localhost:4200/ (alias for `ng serve`).
- `npm run build` — production-capable build to `dist/mj-testing-playground/`. The production configuration uses AOT, output hashing, and enforces budgets: 2mb/5mb initial, 6kb/10kb per component style.
- `npm test` — Jest in single-run mode. Use `npm run test:watch` for interactive watch mode, `npm run test:coverage` for coverage report.
- Run a single test file: `npx jest src/app/app.component.spec.ts`. To focus a single spec, use Jest's `fdescribe` / `fit` (or `describe.only` / `it.only`).
- `npm run lint` — ESLint over `src/**/*.ts` and `src/**/*.html`.
- `npm run e2e` — Playwright against a freshly-served app (dev server starts automatically). Use `npm run e2e:ui` for Playwright's interactive UI mode.
- `npm run storybook` — Storybook 6.5 dev server at http://localhost:6006/. `npm run build-storybook` for a static build.
- `npm run compodoc:serve` — Compodoc documentation server. `npm run compodoc` for a static build.
- Scaffolding: `npx ng generate component <name>` (and `directive|pipe|service|class|guard|interface|enum|module`).

## Conventions enforced by tooling

These come from `.eslintrc.json` / `angular.json` and will fail lint/build if violated — follow them when generating code:

- **Selectors**: components use element selectors with prefix `app-` in **kebab-case** (e.g. `app-foo-bar`); directives use attribute selectors with prefix `app` in **camelCase**.
- **Component styles**: SCSS (`.scss`). `angular.json` already sets the component schematic to
  `scss` and the global stylesheet is `src/styles.scss`, so `ng generate component` scaffolds
  `.scss`. `angular.json` is gate-scope config an agent can't edit (`.ai/HARNESS.md` door 7).
- **TS style**: single quotes, semicolons required, 140-char max line, `no-console` (except `log`/`warn`/`error`).
- **TypeScript target**: `es2017` with `lib: [es2020, dom]`; Angular compiler runs `strictTemplates` and `strictInjectionParameters`.
- **RxJS**: import from `rxjs` / `rxjs/operators` only.

## Tooling summary

| Tool | Purpose | Config |
|------|---------|--------|
| Jest + jest-preset-angular | Unit tests | `jest.config.js`, `setup-jest.ts`, `tsconfig.spec.json` |
| Playwright | E2E tests | `playwright.config.ts`, `e2e/` |
| Storybook 6.5 | Component explorer | `.storybook/` |
| Compodoc | API documentation | `tsconfig.app.json` (via npm script) |
| ESLint + @angular-eslint | Linting | `.eslintrc.json` |

## Layout notes

- `src/app/` — root module (`AppModule`), root component (`AppComponent`), routing module. New features should be added here (or as feature modules imported by `AppModule`).
- `src/environments/` — `environment.ts` is replaced by `environment.prod.ts` in the production build via `fileReplacements` in `angular.json`.
- `e2e/` — Playwright specs (`*.spec.ts`).
- `.storybook/` — Storybook configuration; stories live alongside components as `*.stories.ts`.
- `tsconfig.app.json` (app build) and `tsconfig.spec.json` (Jest) both extend the root `tsconfig.json`.

## Code quality bar

The maintainer reads every line this repo produces, across every stack it grows to
(Angular now; a Node BFF and a Go service are planned — see
`.ai/decisions/0006-klaxon-concept-and-views.md`). "It passes the gate" is necessary,
not sufficient. For any language in this repo:

- Idiomatic in that language, not transliterated from another one (no
  Angular-service-shaped classes in Go; no Java-style getters in TypeScript).
- Comments explain a non-obvious *why* (a workaround, an invariant, a constraint from
  elsewhere in the system) — never restate what well-named code already shows.
- No dead code, no speculative abstraction for a second case that doesn't exist yet,
  no TODO without an owner or a tracked follow-up.
- Errors handled at the boundary they can actually occur at, not swallowed and not
  passed up wrapped in a vaguer type.
- A reviewer unfamiliar with the feature can follow the change from the diff alone;
  if it needs narration, that narration belongs in the PR description or a decision
  record, not skipped.

## The .ai harness

This repo uses the `.ai` harness. Read `.ai/HARNESS.md` before any non-trivial
change, and follow it. Structure and invariants live in `.ai/MODEL.md`; runnable
prompts in `.ai/prompts/`; the design write-up in `docs/vibe-harness.html`.

The gate is `bash .ai/harness/verify.sh [fast|full|smoke|deep]` — it is the only gate
contract.

This file remains the single owner of build commands and code conventions.
Nothing in `.ai/` restates them.
