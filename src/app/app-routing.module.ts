import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdvancedFormComponent } from './advanced-form/advanced-form.component';

// Exported so src/app/smoke-routes.spec.ts can check it against
// e2e/smoke-routes.ts's hand-kept list - the pair that let a route ship
// with no runtime smoke coverage at all (docs/reviews/vibe-harness-v4.3-
// delta-2026-09-10.md, new finding not in the delta itself: a route added
// here without also touching e2e/smoke.spec.ts's ROUTES const got a green
// smoke/deep over a page that never mounted).
export const routes: Routes = [
  { path: 'advanced-form', component: AdvancedFormComponent },
  { path: '', redirectTo: 'advanced-form', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
