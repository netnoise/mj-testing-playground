import { chromium } from '@playwright/test';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 620 } });
await p.goto('http://localhost:4300/board?scenario=ack-failed');
await p.getByRole('button', { name: 'INC-2891' }).click();
await p.screenshot({ path: process.argv[2] + '/selected-live.png' });
await p.getByRole('button', { name: 'Acknowledge' }).click();
await p.getByRole('alert').waitFor();
await p.screenshot({ path: process.argv[2] + '/rolled-back-alert.png' });
await b.close();
