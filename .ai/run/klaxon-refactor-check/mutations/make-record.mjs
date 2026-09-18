// Builds the machine-readable record from results.tsv. For harmless refactors a red cell is
// `flagged` and a green one `unchanged` (0008's caught/missed describe defects, which these are not).
// usage: node make-record.mjs > docs/design/klaxon/findings/harmless-refactors.json
import { readFileSync } from 'node:fs';

const RUN = '.ai/run/klaxon-refactor-check/mutations';
const rows = readFileSync(`${RUN}/results.tsv`, 'utf8').trim().split('\n').map((l) => l.split('\t'));
const cells = rows.filter((r) => r[0] !== 'baseline').map(([patch, layer, file, test, outcome]) => ({
  patch, layer, file, test: test === '-' ? null : test, status: outcome === 'fail' ? 'flagged' : 'unchanged', predicted: 'unchanged',
}));
const patches = ['R1-class-rename', 'R2-selector-rename', 'R3-signal-rename'];
console.log(JSON.stringify({
  id: 'harmless-refactors',
  question: 'Do the frozen board tests stay green when the board is refactored without changing behaviour, roles or looks?',
  iteration: '1b (same frozen suite as heading-demotion)',
  baseline_commit: 'c44571d',
  run_commit: '45c9559',
  test_revision: 'every spec under src/ and e2e/, identical to 7327964, unedited',
  patches: patches.map((p) => ({ id: p, patch: `${RUN}/${p}.patch` })),
  commands: { lint: 'npm run lint', build: 'npm run build', jest: 'npx jest --ci --json', e2e: 'HARNESS_DEEP=1 npx playwright test --reporter=list,json', layout: `node ${RUN}/layout-snapshot.mjs`, replay: `sh ${RUN}/replay.sh` },
  environment: { os: 'Darwin 25.5.0 arm64', node: 'v24.11.1', jest: '30.5.2', playwright: '1.30.0 (chromium)' },
  scenario: 'none (fixed fixture and clock; each cell ran once)',
  summary: {
    cells: cells.length,
    flagged: cells.filter((c) => c.status === 'flagged').length,
    unchanged: cells.filter((c) => c.status === 'unchanged').length,
    predictions_matched: cells.filter((c) => c.status === c.predicted).length,
    layout_snapshot_elements: JSON.parse(readFileSync(`${RUN}/output/baseline.snapshot.json`, 'utf8')).length,
  },
  evidence: { results: `${RUN}/results.tsv`, output_dir: `${RUN}/output/`, restored: `${RUN}/output/restored.deep.txt` },
  cells,
}, null, 2));
