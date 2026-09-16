#!/usr/bin/env sh
# Screenshot evidence for a redesign run. Makes an eyes-checkable "Done when"
# durable instead of live-only - the digest cites the shots, and before/after
# is a `git stash` apart. docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md
# §Stage-3 in the harness's own plan for why this exists: /intake already
# accepts "your eyes could fail" as a valid Done-when
# (.ai/prompts/intake.md:35); what was missing was making that check outlive
# the conversation it happened in.
#
# Four constraints shaped this, all checked against the installed toolchain
# rather than assumed:
#
# - No new Playwright config, and playwright.config.ts untouched. It is
#   gate-scope, so editing it costs a door-7 round - and the tempting
#   workaround (a sibling e2e/shots.config.ts) is worse than it looks:
#   lib.mjs's hit() is exact-match so it wouldn't be BLOCKED, and
#   budget.mjs's unlisted-config scanner only visits repo root, ci/,
#   .github/workflows/ and verify/ - never e2e/ - so it wouldn't be REPORTED
#   either. A file defining browser-test scope, invisible to both guards.
#   This script creates no file under e2e/ at all.
# - Drives the browser directly. @playwright/test@1.30.0 re-exports chromium
#   from playwright-core (confirmed against the installed package at build
#   time), and the matching browser revision is already on disk from normal
#   e2e use. chromium.launch() -> setViewportSize() -> screenshot() needs no
#   test runner and no config.
# - Serves the production build, not a dev server, on a port
#   (SHOTS_PORT/argv[2]) other than serve-dist.mjs's own default 4200 - the
#   same "a leftover process of unknown provenance" class of bug documented
#   in serve-dist.mjs's own header, avoided by not sharing its usual port.
# - Never retypes the route list. Routes are parsed out of
#   e2e/smoke-routes.ts's SMOKE_ROUTES export (a single-line export -
#   ledger.sh already parses config.yml's flows the same way) so this
#   inherits src/app/smoke-routes.spec.ts's drift check for free. Retyping
#   the list here would recreate, in the file that fixed it, the exact
#   second-unchecked-copy bug docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md
#   found in e2e/smoke.spec.ts.
#
# Output is gitignored (.gitignore's /.ai/run/*/shots entry) - .ai/run/ is
# tracked, so unignored PNGs would commit binaries on every redesign run.
# `git add -f` a before/after pair worth keeping permanently.
#
# usage: shots.sh <slug> [route...]   (default: routes parsed from e2e/smoke-routes.ts)
set -e
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$ROOT"

SLUG="${1:?usage: shots.sh <slug> [route...]}"
shift

OUT=".ai/run/$SLUG/shots"
mkdir -p "$OUT"

if [ $# -gt 0 ]; then
  # deliberate word-splitting: routes never contain spaces (same property
  # verify.sh's check-citations invocation and open-run.sh's --type parsing
  # already rely on)
  ROUTES="$*"
else
  ROUTES=$(node -e "
    const fs = require('node:fs');
    const src = fs.readFileSync('e2e/smoke-routes.ts', 'utf8');
    const m = src.match(/SMOKE_ROUTES\s*=\s*\[([^\]]*)\]/);
    if (!m) { console.error('shots: could not find SMOKE_ROUTES in e2e/smoke-routes.ts'); process.exit(1); }
    const routes = m[1].split(',').map((s) => s.trim().replace(/^['\"]|['\"]$/g, '')).filter(Boolean);
    console.log(routes.join(' '));
  ")
fi
[ -n "$ROUTES" ] || { echo "shots: no routes to capture" >&2; exit 1; }

PORT="${SHOTS_PORT:-4321}"

echo "shots: building production bundle..."
npm run build >/dev/null

node e2e/serve-dist.mjs "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT INT TERM

# Poll with a plain node http request rather than curl - no new dependency,
# same reasoning as lib.mjs's "node built-ins only" comment.
node -e "
  const http = require('node:http');
  const deadline = Date.now() + 10000;
  (function poll() {
    http.get('http://localhost:$PORT/', (res) => { res.resume(); process.exit(0); })
      .on('error', () => {
        if (Date.now() > deadline) {
          console.error('shots: server on port $PORT never answered');
          process.exit(1);
        }
        setTimeout(poll, 200);
      });
  })();
"

node --input-type=module -e "
import { chromium } from '@playwright/test';
const routes = '$ROUTES'.split(' ').filter(Boolean);
const widths = [390, 768, 1440];
const browser = await chromium.launch();
let count = 0;
for (const route of routes) {
  const page = await browser.newPage();
  const name = route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '-');
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://localhost:$PORT' + route, { waitUntil: 'networkidle' });
    await page.screenshot({ path: '$OUT/' + name + '-' + width + '.png', fullPage: true });
    count++;
  }
  await page.close();
}
await browser.close();
console.log(\`shots: wrote \${count} screenshot(s) for \${routes.length} route(s) to $OUT\`);
"

echo "shots: done -> $OUT"
