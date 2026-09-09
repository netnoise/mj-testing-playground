#!/usr/bin/env node
// Zero-dependency static server for the PRODUCTION build, used as
// Playwright's webServer for verify.sh's smoke/deep tiers.
//
// Why this exists: verify.sh deep used to run `npm run build` and then
// discard the result, testing `ng serve` instead - so a green deep run
// proved the dev server worked, never the artifact npm run build produced.
// docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md §1.2: the
// dev server can also be a leftover process of unknown provenance, reused
// via playwright.config.ts's reuseExistingServer - which is the mechanism
// behind the one report that reached the user as "all 3 e2e tests pass"
// and was wrong.
//
// SPA history fallback: any request with no file extension that doesn't
// resolve to a real file serves index.html, so a deep-linked route like
// /advanced-form resolves the same way the Angular router would handle it
// client-side.
//
// usage: node e2e/serve-dist.mjs [port]   (default: 4200, or $PORT)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(HERE, '..', 'dist', 'mj-testing-playground');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4200);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function fileExists(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';

    let filePath = join(ROOT, pathname);
    const hasExt = extname(pathname) !== '';

    if (!hasExt || !(await fileExists(filePath))) {
      // SPA fallback: no extension (a route) or a missing file -> index.html
      filePath = join(ROOT, 'index.html');
    }

    const body = await readFile(filePath);
    const type = MIME[extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`serve-dist: ${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`serve-dist: serving ${ROOT} on http://localhost:${PORT}`);
});
