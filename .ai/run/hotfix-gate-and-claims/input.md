# Input — hotfix-gate-and-claims

Received 2026-09-18 in chat. The owner pasted an outside re-review ("Klaxon: honest project review",
"Reassessment after the documentation corrections") and asked: "Is my harness ready to pick up next
task and quickly execute some substantial development?" My answer listed what was wrong; the owner
replied, quoted verbatim:

> plan first , fix all, commit and push as a hotfix

Scope answers (AskUserQuestion, same session):
- Push target: **hotfix branch, no PR yet.**
- Extras: **republish both claude.ai artifacts**, and **make M1-M3 replayable.**

Re-review lines that are requirements, quoted:

> The defensible lesson is: **the test detects this mutation, but also rejects a harmless class
> refactor and fails with an unhelpful error.** ... Measure detection, refactor resilience and
> diagnostic quality separately.

> The evidence is a useful human-readable record, not yet an independently replayed result. ...
> the record does not include standalone mutation patches, complete captured outputs or an explicit
> post-restoration passing run

> The local `CLAUDE.md` Project paragraph describes empty routing and no business logic ... Correct
> that short paragraph before asking an agent to regenerate the application

Facts found by running `bash .ai/harness/verify.sh deep` on master (12d0732), 2026-09-18:
`check-citations` fails on `.ai/run/klaxon-claims-correction/digest.md` and `evidence.md`: a spec
citation written without its `src/app/` directory ("no such file"). Everything before that step passed.
