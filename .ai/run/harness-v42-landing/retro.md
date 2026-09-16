# Retro — harness-v42 landing

Covers getting the remediation actually onto `master`: the stranded merge, the
in-place correction to R1's digest, and PR #17. Continues
`.ai/run/harness-v42-closeout/retro.md`, which was written believing the work was
already delivered — it wasn't, and that gap is mistake 1.

## Verdict

The landing itself was two git operations and warranted about ten minutes. It
should never have been necessary: eight reviewed commits sat one branch away from
`master` for a day because of merge-order advice I got wrong, and it surfaced by
accident rather than by any check.

## Mistakes

1. **My merge-order advice was wrong, and it stranded the work.** Setting up the
   stack, I said #16's base would be retargeted automatically once #15 merged.
   Retargeting moves a PR's base *pointer* when the base branch is deleted; it
   never re-merges content. `git log --merges` shows #15 landing at 00:51:22 and
   #16 at 00:53:00 — 98 seconds apart, in the order that strands rather than the
   order that works. The correct instruction was one sentence: merge the top of the
   stack first. What makes this worse than an ordinary slip is that
   `.ai/run/harness-v42-closeout/retro.md:43` already recorded the adjacent
   mistake — opening a PR without checking whether its base was itself unmerged —
   and I still didn't convert that into the ordering rule the stack actually
   needed. Noticing a hazard without turning it into an instruction is most of the
   way to not noticing it.

2. **It surfaced by luck.** Nothing flagged that `master` was running a different
   harness than the branch — no drift check, no post-merge verification, nothing in
   the design that would have caught it. It came out because you typed `/retro` and
   got "Unknown command." Absent that, `master` would have quietly stayed on the
   pre-remediation harness — old `check-citations.sh`, no Bash guard, no
   `.ai/harness/gate-scope.json` — for as long as nobody happened to invoke a
   command added in the stranded commits. A green gate on a feature branch says
   nothing about what is on `master`, and never claimed to; but this whole
   remediation was about not accepting green as delivered, and I still treated "PR
   merged" as "shipped" without once checking the destination.

3. **I claimed the door-7 list had one owner. It had two, and the second was the
   file every agent reads first.** Reading `.ai/HARNESS.md` because this prompt
   instructs it, its door-7 line was still enumerating the paths by hand — and
   omitting `.claude/settings.json`, which the hook had actively blocked since R1
   and which `.ai/harness/gate-scope.json` lists as enforced. So for two days the
   primary agent-facing doc told a reader a file was safe to edit that the guard
   would stop them on: the exact defect the original audit found in the cheatsheet,
   reintroduced one file over. Fixed in the same commit as this retro — the line is
   now a pointer, and all three docs resolve to the one owner.
   And `.ai/harness/config.yml:18` asserts in writing that this was fixed — "a third
   and fourth copy lived in HARNESS.md and the design docs. All now generated, not
   hand-kept." R3's digest was accurate about what it actually did
   (`.ai/run/harness-v42-r3/digest.md:80` names the cheatsheet and the design doc,
   not HARNESS.md); the false claim is mine, in the comment written to explain the
   fix. The flagship result of the remediation is incomplete in its most-read file,
   and a different file states that it is complete.

## What the harness made harder than the task needed

Nothing this time — the landing was `gh pr create` and `gh pr merge`. The opposite
is worth recording instead: this prompt's own instruction to read `.ai/HARNESS.md`
before starting is what surfaced mistake 3. A full audit, four remediation runs and
two prior retros all walked past a stale door-7 list in the primary doc; one pass of
"read the rules first" found it. That is an argument for the instruction, not for
me — I had read that file repeatedly across the earlier runs and edited its Gates
and Budgets sections without ever re-reading the Doors section above them.

## What actually happened

Both the closeout digest and its retro imply the remediation was delivered. It was
merged, reviewed, and green — and not on `master`. "Delivered" and "merged" turned
out to be different states, and nothing in the harness distinguishes them. That is
the same class of gap the closeout retro named one level down (every digest checks
its own run, nothing checks the plan): here, every run checked its own branch, and
nothing checked the trunk.
