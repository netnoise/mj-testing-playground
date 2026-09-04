#!/usr/bin/env sh
# Resolve every file:line citation in a document. This is the anti-fabrication
# mechanism - a habit does not scale, a script does.
# usage: check-citations.sh <file>...   (default: newest run's markdown)
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

if [ $# -eq 0 ]; then
  SLUG=$(ls -1t .ai/run 2>/dev/null | head -1)
  set -- .ai/run/"$SLUG"/*.md
fi

rm -f /tmp/.cite_fail
checked=0
for doc in "$@"; do
  [ -f "$doc" ] || continue
  grep -oE '[A-Za-z0-9_][A-Za-z0-9_./-]*\.[A-Za-z]+:[0-9]+' "$doc" 2>/dev/null | sort -u | while IFS= read -r cite; do
    path=${cite%:*}; line=${cite##*:}
    if [ ! -f "$path" ]; then
      echo "BAD  $doc -> $cite (no such file)"; echo x >> /tmp/.cite_fail
    elif [ "$(wc -l < "$path")" -lt "$line" ]; then
      echo "BAD  $doc -> $cite (file has $(wc -l < "$path") lines)"; echo x >> /tmp/.cite_fail
    elif [ -z "$(sed -n "${line}p" "$path" | tr -d '[:space:]')" ]; then
      echo "WEAK $doc -> $cite (line is blank)"
    else
      echo "ok   $cite  $(sed -n "${line}p" "$path" | cut -c1-58)"
    fi
  done
  checked=$((checked+1))
done

# vacuous-pass guard: zero citations checked is not a pass
if [ "$checked" -eq 0 ]; then
  echo "check-citations: NO DOCUMENTS CHECKED - this is not a pass" >&2; exit 1
fi
if [ -f /tmp/.cite_fail ]; then rm -f /tmp/.cite_fail; echo "check-citations: FAILED" >&2; exit 1; fi
echo "check-citations: all citations resolve ($checked doc(s))"
