// Turns a Jest --json or Playwright json report into "file<TAB>test<TAB>pass|fail" lines, sorted.
// usage: node collect.mjs jest|pw <report.json>
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const [kind, path] = process.argv.slice(2);
const report = JSON.parse(readFileSync(path, 'utf8'));
const rows = [];

if (kind === 'jest') {
  for (const file of report.testResults) {
    for (const t of file.assertionResults) {
      rows.push([basename(file.name), t.fullName, t.status === 'passed' ? 'pass' : 'fail']);
    }
  }
} else if (kind === 'pw') {
  const walk = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      rows.push([basename(spec.file), [...titles, spec.title].join(' > '), spec.ok ? 'pass' : 'fail']);
    }
    for (const child of suite.suites ?? []) {
      const own = child.file && child.title === basename(child.file) ? titles : [...titles, child.title];
      walk(child, own);
    }
  };
  for (const suite of report.suites) walk(suite, suite.title === basename(suite.file ?? '') ? [] : [suite.title]);
} else {
  throw new Error(`unknown kind: ${kind}`);
}

rows.sort((a, b) => a.join('\t').localeCompare(b.join('\t')));
for (const row of rows) console.log(row.join('\t'));
