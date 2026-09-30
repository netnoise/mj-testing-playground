// Builds the machine-readable finding record from results.tsv. Statuses follow decision 0008 §2:
// a mutated cell that failed is `caught`, one that passed is `missed`, a test that never renders the
// board is `not applicable`, and layers that don't exist are `not run`. Adapted from
// .ai/run/colour-only-severity-finding/mutations/make-record.mjs; adds a cell-by-cell comparison with it.
// usage: node make-record.mjs > docs/design/klaxon/findings/aria-label-severity.json
import { readFileSync } from 'node:fs';

const RUN = '.ai/run/aria-label-severity-finding/mutations';
const rows = readFileSync(`${RUN}/results.tsv`, 'utf8').trim().split('\n').map((l) => l.split('\t'));
const NEVER_RENDER_BOARD = new Set(['format-age.spec.ts', 'incident-source.spec.ts', 'advanced-form.validators.spec.ts', 'smoke-routes.spec.ts']);
const PREDICTED_CAUGHT = new Set([
  'jest|board.spec.ts|Board lists every incident in a table with column headers, and shows severity as visible text',
  'layout|snapshot|-',
]);

const baseline = new Map(rows.filter((r) => r[0] === 'baseline').map((r) => [r.slice(1, 4).join('|'), r[4]]));
const cells = rows.filter((r) => r[0] === 'M3-aria-label-severity').map(([, layer, file, test, outcome]) => {
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
const after = JSON.parse(readFileSync(`${RUN}/output/M3-aria-label-severity.snapshot.json`, 'utf8'));
const differing = before.filter((el, i) => JSON.stringify(el) !== JSON.stringify(after[i]));
const COLOUR_ONLY = '.ai/run/colour-only-severity-finding/mutations';
const reference = readFileSync(`${COLOUR_ONLY}/results.tsv`, 'utf8').trim().split('\n').map((l) => l.split('\t'))
  .filter((r) => r[0] === 'M2-colour-only-severity');
const same = (c) => reference.some(([, layer, file, test, outcome]) => layer === c.layer && file === (c.file ?? file) && test === (c.test ?? '-')
  && (outcome === 'fail') === (c.status === 'caught'));
const comparable = cells.filter((c) => c.status !== 'not run');
const refAfter = JSON.parse(readFileSync(`${COLOUR_ONLY}/output/M2-colour-only-severity.snapshot.json`, 'utf8'));
const count = (s) => cells.filter((c) => c.status === s).length;
console.log(JSON.stringify({
  id: 'aria-label-severity',
  question: 'Can the frozen suite tell a severity badge that is visually gone but still named from one gone entirely?',
  iteration: 1,
  baseline_commit: '9db523f',
  run_commit: '51ebe68',
  test_revision: 'every spec under src/ and e2e/ at 9db523f (unchanged since 59631ef), unedited',
  mutation: {
    patch: `${RUN}/M3-aria-label-severity.patch`,
    files: ['src/app/board/board.html', 'src/app/board/board.scss'],
    leaves_untouched: ['filter button text', 'inspector Severity row'],
    measured: {
      evidence: [`${RUN}/badge.baseline.json`, `${RUN}/badge.mutated.json`],
      rows: 12,
      badge_text: { baseline: ['CRIT', 'MAJ', 'MIN'], mutated: [''] },
      accessible_name_of_first_cell: { baseline: 'CRIT', mutated: 'CRIT' },
      role_after: 'img',
      aria_label_after: ['CRIT', 'MAJ', 'MIN'],
      badges_found_by_role_and_name: { baseline: 0, mutated: 12 },
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
  compared_with: {
    finding: 'colour-only-severity',
    cells_compared: comparable.length,
    cells_identical: comparable.filter(same).length,
    differing_cells: comparable.filter((c) => !same(c)).map((c) => ({ layer: c.layer, file: c.file, test: c.test })),
    layout_snapshot_elements_differing_from_colour_only: after.filter((el, i) => JSON.stringify(el) !== JSON.stringify(refAfter[i])).length,
  },
  evidence: { results: `${RUN}/results.tsv`, output_dir: `${RUN}/output/`, restored: `${RUN}/output/restored.deep.txt`, negative_control: `${RUN}/output/negative-control.txt` },
  cells,
}, null, 2));
