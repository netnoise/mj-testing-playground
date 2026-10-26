// Builds the machine-readable finding record from results.tsv. Statuses follow decision 0008 §2:
// a mutated cell that failed is `caught`, one that passed is `missed`, a test that never renders the
// board is `not applicable`, and layers that don't exist are `not run`. Adapted from
// .ai/run/aria-label-severity-finding/mutations/make-record.mjs; the cell-by-cell comparison with another finding is dropped.
// usage: node make-record.mjs > docs/design/klaxon/findings/no-rollback-ack.json
import { readFileSync } from 'node:fs';

const RUN = '.ai/run/no-rollback-ack-finding/mutations';
const rows = readFileSync(`${RUN}/results.tsv`, 'utf8').trim().split('\n').map((l) => l.split('\t'));
const NEVER_RENDER_BOARD = new Set(['format-age.spec.ts', 'incident-source.spec.ts', 'incident-source-ack.spec.ts', 'advanced-form.validators.spec.ts', 'smoke-routes.spec.ts']);
const PREDICTED_CAUGHT = new Set([
  'jest|board-ack.spec.ts|Board acknowledge puts the incident back to live, says which one failed, and offers Acknowledge again when the fake rejects',
  'e2e|board-ack.spec.ts|a failed acknowledgement is rolled back and reported',
]);

const baseline = new Map(rows.filter((r) => r[0] === 'baseline').map((r) => [r.slice(1, 4).join('|'), r[4]]));
const cells = rows.filter((r) => r[0] === 'M4-no-rollback').map(([, layer, file, test, outcome]) => {
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
const state = (name) => JSON.parse(readFileSync(`${RUN}/ack-state.${name}.json`, 'utf8'));
console.log(JSON.stringify({
  id: 'no-rollback-ack',
  question: 'Does the frozen suite notice an optimistic acknowledge that is never rolled back when the fake fails?',
  iteration: 1,
  baseline_commit: '8eaab01',
  run_commit: '6fa33be',
  test_revision: 'every spec under src/ and e2e/ at 8eaab01, unedited',
  mutation: {
    patch: `${RUN}/M4-no-rollback.patch`,
    files: ['src/app/board/board.ts'],
    leaves_untouched: ['the optimistic update', 'the role="alert" message'],
    measured: { evidence: [`${RUN}/ack-state.baseline.json`, `${RUN}/ack-state.mutated.json`], baseline: state('baseline'), mutated: state('mutated') },
  },
  commands: { lint: 'npm run lint', build: 'npm run build', jest: 'npx jest --ci --json', e2e: 'HARNESS_DEEP=1 npx playwright test --reporter=list,json', layout: `node ${RUN}/layout-snapshot.mjs`, measure: `sh ${RUN}/measure.sh`, replay: `sh ${RUN}/replay.sh` },
  environment: { os: 'Darwin 27.0.0', node: 'v24.11.1', jest: '30.5.2', playwright: '1.30.0 driving Chrome for Testing 156.0.8078.4 through PW_CHROMIUM (earlier findings: Chromium 110)' },
  scenario: 'ack-failed for the rollback specs, none otherwise (fixed fixture and clock; each cell ran once)',
  summary: { caught: count('caught'), missed: count('missed'), not_applicable: count('not applicable'), not_run: count('not run'), predictions_matched: cells.filter((c) => c.matches_prediction).length, cells: cells.length },
  evidence: { results: `${RUN}/results.tsv`, output_dir: `${RUN}/output/`, restored: `${RUN}/output/restored.deep.txt`, negative_control: `${RUN}/output/negative-control.txt` },
  cells,
}, null, 2));
