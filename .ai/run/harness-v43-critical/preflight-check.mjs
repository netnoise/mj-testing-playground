// Standalone copy of patch-verify.sh's DISCLOSURE_FAIL preflight logic, as a
// real file instead of a `node -e` string - avoids a shell-quoting hairball
// for what is otherwise identical logic. Same protected-path source
// (gate-scope.json's "patterns" + .ai/MODEL.md), same active-run scan, same
// gateDiff call. usage: node preflight-check.mjs (run with cwd = fixture root)
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ROOT = process.env.LIB_ROOT;
const { gateDiff } = await import(ROOT + '/.ai/harness/lib.mjs');

let patterns = [];
try {
  patterns = JSON.parse(readFileSync('.ai/harness/gate-scope.json', 'utf8')).patterns || [];
} catch { /* none */ }
const protectedPaths = [...patterns, '.ai/MODEL.md'];

let slug = null;
let state = {};
const runsDir = '.ai/run';
if (existsSync(runsDir)) {
  for (const s of readdirSync(runsDir)) {
    const p = runsDir + '/' + s + '/state.json';
    if (!existsSync(p)) continue;
    try {
      const st = JSON.parse(readFileSync(p, 'utf8'));
      if (st.status === 'active') { slug = s; state = st; break; }
    } catch { /* unreadable state is not a reason to block */ }
  }
}

const crossed = gateDiff(protectedPaths, { ...state, slug }, process.cwd());
if (crossed.length) {
  console.error('crossed: ' + crossed.join(', '));
  process.exit(1);
}
process.exit(0);
