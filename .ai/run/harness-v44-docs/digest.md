## Design page and cheatsheet describe v4.4; both artifacts republished   harness/v44-intake · verify: docs only · 3 files

### What surprised me
The published Vibe Harness page was *ahead* of the repo. It held the whole v4.3 write-up (Bash
guard as a tree-check, clock and ruler fixes, the v4.3 phase card) while `docs/vibe-harness.html`
had only the label bump. That's the page's own §09 lesson, a label that ships without its prose,
happening in a new direction: prose that shipped without reaching the repo. The repo copy was
synced first, as its own commit, so the v4.4 diff is readable on its own.

### What I did
- `a3ce4b4` syncs the repo to the published v4.3 page. `3d0de49` adds the v4.4 content to both
  pages and marks the roadmap item done.
- Republished Vibe Harness (v9) and the Cheatsheet (v3) at their existing URLs.
- Stale claims fixed where touched: "any agent" portability, `/fix` in the lightweight test,
  implement's frontmatter (was 45m · 12 files), digest routed as small, and the §08 ledger table
  now labelled illustrative.

Not changed on purpose: the vehicle-models examples in §02, §05 and §06, including the
store-mocking card that came from another repo. They're captioned as run artifacts and would be
their own rewrite.

`unverified_at_runtime` doesn't apply here: there's no app code in this change. Checked: one
screenshot of the cheatsheet's changed area.

### What I got wrong
Nothing worth a retro.
