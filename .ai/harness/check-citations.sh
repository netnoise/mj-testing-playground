#!/usr/bin/env sh
# Resolve every file:line citation in a document. This is the anti-fabrication
# mechanism - a habit does not scale, a script does.
#
# v4.2 remediation (docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md,
# workstream R3): bare-path citations (no :line) are now checked too - this is
# exactly what let .ai/MODEL.md's reference to a deleted file read as clean;
# the vacuous-pass guard now covers zero CITATIONS, not just zero documents (a
# single real citation used to make "2 doc(s)" print as a pass); a document can
# open with `<!-- cite-base: <sha> --> to be checked against that commit rather
# than the live tree, so a brief describing a tree its own run then changed
# doesn't go permanently red; and the fail-marker file is now a per-run mktemp,
# not a fixed /tmp path two concurrent checks could stomp on each other with.
#
# usage: check-citations.sh <file>...   (default: newest run's markdown)
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

if [ $# -eq 0 ]; then
  # docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md §1.5: status-based via
  # lib.mjs, not "most recently modified" (mtime), which is the mechanism
  # that let editing an old run's digest in place pull that run into a gate
  # meant for the run actually being handed back.
  SLUG=$(node .ai/harness/lib.mjs current-run 2>/dev/null || true)
  set -- .ai/run/"$SLUG"/*.md
fi

WORK=$(mktemp -d "${TMPDIR:-/tmp}/check-citations.XXXXXX")
FAIL_MARK="$WORK/fail"
COUNT_MARK="$WORK/count"
trap 'rm -rf "$WORK"' EXIT INT TERM
: > "$COUNT_MARK"

checked=0
for doc in "$@"; do
  [ -f "$doc" ] || continue

  # A document may pin itself to a commit: <!-- cite-base: <sha> --> anywhere
  # in the first 5 lines. Citations then resolve against `git show <sha>:path`
  # instead of the live file - for a brief whose own run changed the tree it
  # described.
  BASE=$(head -5 "$doc" | grep -oE '<!-- *cite-base: *[0-9a-fA-F]{4,40} *-->' | grep -oE '[0-9a-fA-F]{4,40}' | head -1 || true)

  resolve_content() {
    # $1 = path -> prints file content, or nothing + returns 1 if unresolvable
    if [ -n "$BASE" ]; then
      git show "${BASE}:$1" 2>/dev/null
    else
      [ -f "$1" ] && cat "$1"
    fi
  }
  path_exists() {
    if [ -n "$BASE" ]; then
      git cat-file -e "${BASE}:$1" 2>/dev/null
    else
      [ -f "$1" ]
    fi
  }

  # --- path:line citations --------------------------------------------------
  grep -oE '\.?[A-Za-z0-9_][A-Za-z0-9_./-]*\.[A-Za-z]+:[0-9]+' "$doc" 2>/dev/null | sort -u | while IFS= read -r cite; do
    path=${cite%:*}; line=${cite##*:}
    echo x >> "$COUNT_MARK"
    if ! path_exists "$path"; then
      echo "BAD  $doc -> $cite (no such file$([ -n "$BASE" ] && echo " at $BASE"))"; echo x >> "$FAIL_MARK"
      continue
    fi
    content=$(resolve_content "$path")
    total=$(printf '%s\n' "$content" | wc -l | tr -d ' ')
    if [ "$total" -lt "$line" ]; then
      echo "BAD  $doc -> $cite (file has $total lines$([ -n "$BASE" ] && echo " at $BASE"))"; echo x >> "$FAIL_MARK"
    else
      got=$(printf '%s\n' "$content" | sed -n "${line}p")
      if [ -z "$(printf '%s' "$got" | tr -d '[:space:]')" ]; then
        echo "WEAK $doc -> $cite (line is blank)"
      else
        echo "ok   $cite  $(printf '%s' "$got" | cut -c1-58)"
      fi
    fi
  done

  # --- bare-path citations (no :line) ---------------------------------------
  # Only inside backticks, and only if it contains a '/' - a bare tool name
  # like `budget.mjs` is a normal mention, not a location claim. A path *is*
  # a claim ("this file exists, at this location") even with no line number,
  # and this is the shape that let a reference to a deleted file read clean:
  # .ai/MODEL.md once cited src/app/vehicle/vehicle.service.ts, undetected,
  # after the file itself was deleted.
  grep -oE '`[A-Za-z0-9_.][A-Za-z0-9_./-]*/[A-Za-z0-9_./-]*\.[A-Za-z]+`' "$doc" 2>/dev/null \
    | tr -d '`' | grep -vE ':[0-9]+$' | sort -u | while IFS= read -r path; do
    echo x >> "$COUNT_MARK"
    if ! path_exists "$path"; then
      echo "BAD  $doc -> $path (no such file$([ -n "$BASE" ] && echo " at $BASE")) [bare path]"; echo x >> "$FAIL_MARK"
    else
      echo "ok   $path  [bare path, exists$([ -n "$BASE" ] && echo " at $BASE")]"
    fi
  done

  checked=$((checked+1))
done

total_citations=$(wc -l < "$COUNT_MARK" 2>/dev/null | tr -d ' ')
[ -z "$total_citations" ] && total_citations=0

# vacuous-pass guard: zero documents is not a pass, and neither is a document
# with zero citations in it - "2 doc(s)" used to print as a pass off a single
# citation shared between them.
if [ "$checked" -eq 0 ]; then
  echo "check-citations: NO DOCUMENTS CHECKED - this is not a pass" >&2; exit 1
fi
if [ "$total_citations" -eq 0 ]; then
  echo "check-citations: NO CITATIONS FOUND across $checked doc(s) - this is not a pass" >&2; exit 1
fi
if [ -f "$FAIL_MARK" ]; then
  echo "check-citations: FAILED" >&2; exit 1
fi
echo "check-citations: all citations resolve ($checked doc(s), $total_citations citation(s))"
