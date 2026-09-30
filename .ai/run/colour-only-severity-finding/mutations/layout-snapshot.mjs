// Prints a snapshot of everything the board renders inside <main>: tag, role, text, computed
// typography and spacing, and position. Two snapshots being equal is the measurement behind "this
// refactor is visually and semantically harmless". Host tags starting with `app-` are normalised
// because renaming a component selector legitimately changes that one tag.
// usage: node layout-snapshot.mjs <baseURL>   (needs the production build being served)
import { chromium } from '@playwright/test';

const baseURL = process.argv[2] ?? 'http://localhost:4300';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`${baseURL}/board`);
await page.getByRole('button', { name: 'INC-2891' }).click();
const snapshot = await page.evaluate(() => {
  const props = ['fontSize', 'fontWeight', 'fontFamily', 'color', 'backgroundColor', 'display', 'marginTop', 'marginBottom',
    'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'borderTopWidth', 'outlineStyle'];
  return [...document.querySelectorAll('main *')].map((el) => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    return {
      tag: tag.startsWith('app-') ? 'app-*' : tag,
      role: el.getAttribute('role'),
      ariaPressed: el.getAttribute('aria-pressed'),
      text: [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' '),
      style: Object.fromEntries(props.map((p) => [p, style[p]])),
      box: [box.x, box.y, box.width, box.height].map((v) => Math.round(v * 100) / 100),
    };
  });
});
console.log(JSON.stringify(snapshot));
await browser.close();
