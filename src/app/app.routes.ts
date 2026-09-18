import { Routes } from '@angular/router';

import { Board } from './board/board';

// Exported so src/app/smoke-routes.spec.ts can check it against
// e2e/smoke-routes.ts's hand-kept list - the pair that let a route ship
// with no runtime smoke coverage at all (docs/reviews/vibe-harness-v4.3-
// delta-2026-09-10.md, new finding not in the delta itself: a route added
// here without also touching e2e/smoke.spec.ts's ROUTES const got a green
// smoke/deep over a page that never mounted).
export const routes: Routes = [
  { path: 'board', component: Board },
  { path: '', redirectTo: 'board', pathMatch: 'full' }
];
