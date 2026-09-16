import { defineConfig, devices } from '@playwright/test';

const DEEP = !!process.env['HARNESS_DEEP'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Only set when PW_CHROMIUM points at a preinstalled browser (e.g. a
        // container with no browser download access). Mac behavior untouched.
        ...(process.env['PW_CHROMIUM']
          ? { launchOptions: { executablePath: process.env['PW_CHROMIUM'] } }
          : {}),
      },
    },
  ],
  webServer: {
    // HARNESS_DEEP (set by verify.sh's smoke/deep tiers) points Playwright at
    // the actual production build via a zero-dependency static server
    // (e2e/serve-dist.mjs) instead of `ng serve` - so a green run means the
    // artifact `npm run build` produced actually executed, not a dev server
    // with its own live-reload client and its own runtime behavior.
    // docs/reviews/harness-v4.2-implementation-audit-2026-09-08.md §1.2.
    //
    // reuseExistingServer is forced false for HARNESS_DEEP: a leftover dev
    // server of unknown provenance being silently reused is the mechanism
    // behind the one report that reached the user as "all 3 e2e tests pass"
    // and turned out wrong (decision 0005 / the ui-shell-redesign retro).
    // Ordinary `npm run e2e` (no HARNESS_DEEP) is untouched - still `ng serve`
    // with reuse, for a fast local loop.
    command: DEEP ? 'node e2e/serve-dist.mjs' : 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: DEEP ? false : !process.env['CI'],
  },
});
