// Builds the machine-readable finding record from results.tsv. Statuses follow decision 0008 §2:
// a mutated cell that failed is `caught`, one that passed is `missed`, a test that never renders the
// board is `not applicable`, and layers that don't exist are `not run`.
// usage: node make-record.mjs > docs/design/klaxon/findings/heading-demotion.json
import { readFileSync } from 'node:fs';

const RUN = '.ai/run/klaxon-heading-finding/mutations';
const rows = readFileSync(`${RUN}/results.tsv`, 'utf8').trim().split('\n').map((l) => l.split('\t'));
const NEVER_RENDER_BOARD = new Set(['format-age.spec.ts', 'incident-source.spec.ts', 'advanced-form.validators.spec.ts', 'smoke-routes.spec.ts']);
const PREDICTED_CAUGHT = new Set([
  'jest|board.spec.ts|Board lists every incident in a table with column headers, and shows severity as visible text',
  'e2e|board.spec.ts|filters by severity and shows the details of a clicked incident',
]);

const baseline = new Map(rows.filter((r) => r[0] === 'baseline').map((r) => [r.slice(1, 4).join('|'), r[4]]));
const cells = rows.filter((r) => r[0] === 'M1').map(([, layer, file, test, outcome]) => {
  const key = [layer, file, test].join('|');
  const applicable = !(layer === 'jest' && NEVER_RENDER_BOARD.has(file));
  const status = !applicable ? 'not applicable' : outcome === 'fail' ? 'caught' : 'missed';
  const predicted = !applicable ? 'not applicable' : PREDICTED_CAUGHT.has(key) ? 'caught' : 'missed';
  return { layer, file, test: test === '-' ? null : test, status, predicted, matches_prediction: status === predicted, healthy_baseline: baseline.get(key) === 'pass' };
});
for (const layer of ['axe', 'visual regression']) {
  cells.push({ layer, file: null, test: null, status: 'not run', predicted: 'not run', matches_prediction: true, healthy_baseline: null, reason: 'not installed' });
}

const count = (s) => cells.filter((c) => c.status === s).length;
console.log(JSON.stringify({
  id: 'heading-demotion',
  question: 'Does any layer of the frozen suite notice the board heading demoted from an h1 to a visually identical div?',
  iteration: 1,
  baseline_commit: '7327964',
  run_commit: '13820cc',
  test_revision: 'every spec under src/ and e2e/ at 7327964, unedited',
  mutation: {
    patch: `${RUN}/M1-heading-demotion.patch`,
    files: ['src/app/board/board.html', 'src/app/board/board.scss'],
    visually_identical: { evidence: [`${RUN}/metrics.baseline.json`, `${RUN}/metrics.mutated.json`], differs_only_in: 'tag (h1 -> div)' },
  },
  commands: { lint: 'npm run lint', build: 'npm run build', jest: 'npx jest --ci --json', e2e: 'HARNESS_DEEP=1 npx playwright test --reporter=list,json', replay: `sh ${RUN}/replay.sh` },
  environment: { os: 'Darwin 25.5.0 arm64', node: 'v24.11.1', jest: '30.5.2', playwright: '1.30.0 (chromium)' },
  scenario: 'none (fixed fixture and clock; each cell ran once)',
  summary: { caught: count('caught'), missed: count('missed'), not_applicable: count('not applicable'), not_run: count('not run'), predictions_matched: cells.filter((c) => c.matches_prediction).length, cells: cells.length },
  evidence: { results: `${RUN}/results.tsv`, output_dir: `${RUN}/output/`, restored: `${RUN}/output/restored.deep.txt` },
  cells,
}, null, 2));
