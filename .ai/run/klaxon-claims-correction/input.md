# Input — klaxon-claims-correction

Received 2026-09-18, pasted into chat: "Klaxon: honest project review" (reviewed 18 September 2026,
read-only source/design review against GitHub `master`). Requirement lines, quoted:

> **Keep Klaxon. Reduce the first milestone substantially.**

> The write-up claims that replacing the title's `h1` with a styled `div` leaves the current test
> green ... the assertion explicitly calls `querySelector('.app-header h1').textContent`; if the
> matching heading becomes a div and no matching h1 remains, that selector returns null and the
> assertion cannot pass as claimed.

> renaming only a stylesheet selector does not change the DOM selector match. Distinguish a
> coordinated class refactor from a CSS-only change.

> **Recommendation:** Reproduce both mutations and record their actual outcomes.

> The README calls the severity badge colour-only ... The board HTML, however, contains visible
> `CRIT`, `MAJ`, and `MIN` labels in those badges.

> **Recommendation:** Start with accessible labels in the normal application. Make the
> colour-only variant an explicit, isolated mutation that removes the meaningful text.

> **Recommendation:** Distinguish `hypothesis`, `caught`, `missed`, `not run`, `not applicable`,
> and `infrastructure error`. Freeze the initial suite, run the mutation, then record any improved
> test as a separate iteration.

> **Recommendation:** Keep Go in the roadmap, after a measured frontend finding.

> The stopping rule matters: no archive, rota, full Findings UI, Go service, or mutation framework
> is needed to call the first milestone complete.

Owner's scope choice (AskUserQuestion, same session): **"Docs correction first"** — fix 0006, the
README and the write-up; record as decision 0008; no app code.
