// Measures what the board shows after an Acknowledge click, once the fake has answered. Run against the production build
// being served: under `?scenario=ack-failed` it waits for the alert, then reads the row, the inspector and the button;
// with no scenario it waits for the same delay and reads the same things.
// usage: node ack-state.mjs <baseURL>
import { chromium } from '@playwright/test';

const baseURL = process.argv[2] ?? 'http://localhost:4300';
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

async function measure(scenario) {
  const page = await browser.newPage();
  await page.goto(`${baseURL}/board${scenario ? `?scenario=${scenario}` : ''}`);
  await page.getByRole('button', { name: 'INC-2891' }).click();
  const inspector = page.getByRole('complementary', { name: 'Incident details' });
  await inspector.getByRole('button', { name: 'Acknowledge' }).click();
  if (scenario) {
    await page.getByRole('alert').waitFor();
  } else {
    await page.waitForTimeout(600); // longer than ACK_DELAY_MS (400): this is a measurement script, not a test
  }
  const result = {
    scenario: scenario ?? 'none',
    alert: await page.getByRole('alert').count(),
    row: (await page.getByRole('row').filter({ hasText: 'INC-2891' }).innerText()).replace(/\s+/g, ' ').trim(),
    inspectorStatus: /LIVE|ACKED/.exec(await inspector.innerText())?.[0] ?? null,
    acknowledgeButtons: await inspector.getByRole('button', { name: 'Acknowledge' }).count(),
  };
  await page.close();
  return result;
}

console.log(JSON.stringify([await measure('ack-failed'), await measure(undefined)], null, 2));
await browser.close();
