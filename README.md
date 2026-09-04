# MjTestingPlayground

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## AI harness

This repo carries a small, portable harness for working with coding agents:
plain markdown plus four shell scripts, no dependencies.

- `docs/vibe-harness.html` — the design, and why each piece exists
- `.ai/HARNESS.md` — the one-page rules an agent reads
- `.ai/harness/verify.sh [fast|full|deep]` — the only gate contract

It is tool-agnostic: `CLAUDE.md` and `AGENTS.md` are three-line pointers at
`.ai/`, so switching agents is a one-file change.
