// Prints the board heading element's computed layout, so "the demotion is visually identical" is a
// measurement. Usage: node heading-metrics.mjs <baseURL>  (needs the production build being served).
import { chromium } from '@playwright/test';

const baseURL = process.argv[2] ?? 'http://localhost:4300';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${baseURL}/board`);
const metrics = await page.locator('.board-header > :first-child').evaluate((el) => {
  const style = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    text: el.textContent,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    display: style.display,
    width: Math.round(box.width * 100) / 100,
    height: Math.round(box.height * 100) / 100,
  };
});
console.log(JSON.stringify(metrics));
await browser.close();
