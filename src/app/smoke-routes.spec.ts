import { routes } from './app-routing.module';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SMOKE_ROUTES } = require('../../e2e/smoke-routes');

// New finding, not in docs/reviews/vibe-harness-v4.3-delta-2026-09-10.md's
// own list: e2e/smoke.spec.ts kept its own hand-typed copy of the route
// list, so a route added to app-routing.module.ts without also touching
// the e2e spec got a green `smoke`/`deep` over a page that never mounted -
// HARNESS.md's "an empty list. 'Nothing failed' over zero checks is a
// vacuous pass" applied to a *new* route, not an existing check. Angular's
// routing config is the actual source of truth; this spec is the check,
// not e2e/smoke-routes.ts itself (that file is Playwright-side and can't
// cheaply import the Angular module tree - see its own header).
//
// require(), not import, for the e2e file: ts-jest resolves it fine either
// way, but a static `import` of a path outside src/ read oddly next to
// tsconfig.spec.json's `include: ["src/**/*.spec.ts", ...]` - this makes
// the cross-boundary read explicit rather than implicit.
describe('smoke route coverage', () => {
  const declaredPaths = routes
    .filter((r) => typeof r.path === 'string' && !r.redirectTo)
    .map((r) => `/${r.path}`);

  it('every routed path has a route with a component (sanity on the fixture itself)', () => {
    expect(declaredPaths.length).toBeGreaterThan(0);
  });

  it.each(declaredPaths)('%s is covered by e2e/smoke-routes.ts', (path) => {
    expect(SMOKE_ROUTES).toContain(path);
  });

  it('root ("/") is covered even though the router only declares a redirect', () => {
    // app-routing.module.ts's '' entry is redirectTo-only (no component of
    // its own), so it's filtered out of declaredPaths above - but '/' is a
    // real, separately-reachable URL and belongs in the smoke list too.
    expect(SMOKE_ROUTES).toContain('/');
  });
});
