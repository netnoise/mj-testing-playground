// Builds the machine-readable finding record from results.tsv. Statuses follow decision 0008 §2:
// a mutated cell that failed is `caught`, one that passed is `missed`, a test that never renders the
// board is `not applicable`, and layers that don't exist are `not run`. Adapted from
// .ai/run/klaxon-heading-finding/mutations/make-record.mjs; the layout snapshot is a layer here.
// usage: node make-record.mjs > docs/design/klaxon/findings/colour-only-severity.json
import { readFileSync } from 'node:fs';

const RUN = '.ai/run/colour-only-severity-finding/mutations';
const rows = readFileSync(`${RUN}/results.tsv`, 'utf8').trim().split('\n').map((l) => l.split('\t'));
const NEVER_RENDER_BOARD = new Set(['format-age.spec.ts', 'incident-source.spec.ts', 'advanced-form.validators.spec.ts', 'smoke-routes.spec.ts']);
const PREDICTED_CAUGHT = new Set([
  'jest|board.spec.ts|Board lists every incident in a table with column headers, and shows severity as visible text',
  'layout|snapshot|-',
]);

const baseline = new Map(rows.filter((r) => r[0] === 'baseline').map((r) => [r.slice(1, 4).join('|'), r[4]]));
const cells = rows.filter((r) => r[0] === 'M2-colour-only-severity').map(([, layer, file, test, outcome]) => {
  const key = [layer, file, test].join('|');
  const applicable = !(layer === 'jest' && NEVER_RENDER_BOARD.has(file));
  const status = !applicable ? 'not applicable' : outcome === 'fail' ? 'caught' : 'missed';
  const predicted = !applicable ? 'not applicable' : PREDICTED_CAUGHT.has(key) ? 'caught' : 'missed';
  return { layer, file, test: test === '-' ? null : test, status, predicted, matches_prediction: status === predicted, healthy_baseline: baseline.get(key) === 'pass' };
});
for (const layer of ['axe', 'visual regression']) {
  cells.push({ layer, file: null, test: null, status: 'not run', predicted: 'not run', matches_prediction: true, healthy_baseline: null, reason: 'not installed' });
}

const before = JSON.parse(readFileSync(`${RUN}/output/baseline.snapshot.json`, 'utf8'));
const after = JSON.parse(readFileSync(`${RUN}/output/M2-colour-only-severity.snapshot.json`, 'utf8'));
const differing = before.filter((el, i) => JSON.stringify(el) !== JSON.stringify(after[i]));
const count = (s) => cells.filter((c) => c.status === s).length;
console.log(JSON.stringify({
  id: 'colour-only-severity',
  question: 'Does any layer of the frozen suite notice the board table\'s severity badge reduced to a coloured mark with no text and no accessible name?',
  iteration: 1,
  baseline_commit: 'e56bed4',
  run_commit: '011662d',
  test_revision: 'every spec under src/ and e2e/ at e56bed4 (unchanged since 59631ef), unedited',
  mutation: {
    patch: `${RUN}/M2-colour-only-severity.patch`,
    files: ['src/app/board/board.html', 'src/app/board/board.scss'],
    leaves_untouched: ['filter button text', 'inspector Severity row'],
    measured: {
      evidence: [`${RUN}/badge.baseline.json`, `${RUN}/badge.mutated.json`],
      rows: 12,
      badge_text: { baseline: ['CRIT', 'MAJ', 'MIN'], mutated: [''] },
      accessible_name_of_first_cell: { baseline: 'CRIT', mutated: '' },
      aria_label_or_title_after: 'none',
      colour_unchanged: true,
    },
  },
  commands: { lint: 'npm run lint', build: 'npm run build', jest: 'npx jest --ci --json', e2e: 'HARNESS_DEEP=1 npx playwright test --reporter=list,json', layout: `node ${RUN}/layout-snapshot.mjs`, replay: `sh ${RUN}/replay.sh` },
  environment: { os: 'Darwin 25.5.0 arm64', node: 'v24.11.1', jest: '30.5.2', playwright: '1.30.0 (chromium)' },
  scenario: 'none (fixed fixture and clock; each cell ran once)',
  summary: {
    caught: count('caught'), missed: count('missed'), not_applicable: count('not applicable'), not_run: count('not run'),
    predictions_matched: cells.filter((c) => c.matches_prediction).length, cells: cells.length,
    layout_snapshot: { elements: before.length, differing: differing.length, text_changed: differing.filter((el, i) => el.text !== after[before.indexOf(el)].text).length },
  },
  evidence: { results: `${RUN}/results.tsv`, output_dir: `${RUN}/output/`, restored: `${RUN}/output/restored.deep.txt`, negative_control: `${RUN}/output/negative-control.txt` },
  cells,
}, null, 2));
