// Measures the SEV badge in every table row: the text it shows, every attribute that could name it
// for assistive technology, and its colour. Two runs being compared (baseline vs mutated) is the
// evidence that the mutation removed the text and the accessible name and left the colour alone.
// usage: node badge-metrics.mjs <baseURL>   (needs the production build being served)
import { chromium } from '@playwright/test';

const baseURL = process.argv[2] ?? 'http://localhost:4300';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${baseURL}/board`);
const badges = await page.evaluate(() =>
  [...document.querySelectorAll('tbody .sev')].map((el) => {
    const row = el.closest('tr');
    return {
      incident: row.querySelector('button')?.textContent?.trim(),
      className: el.className,
      text: el.textContent.trim(),
      ariaLabel: el.getAttribute('aria-label'),
      ariaLabelledby: el.getAttribute('aria-labelledby'),
      title: el.getAttribute('title'),
      color: getComputedStyle(el).color,
      backgroundColor: getComputedStyle(el).backgroundColor,
      width: Math.round(el.getBoundingClientRect().width * 100) / 100,
    };
  }),
);
// What assistive technology is offered for the row's first cell: its accessibility subtree.
const cell = await page.getByRole('row').nth(1).getByRole('cell').first().elementHandle();
const firstCellAccessibility = await page.accessibility.snapshot({ root: cell, interestingOnly: false });
console.log(JSON.stringify({ firstCellAccessibility, badges }, null, 2));
await browser.close();
