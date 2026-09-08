import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdvancedFormComponent } from './advanced-form/advanced-form.component';

const routes: Routes = [
  { path: 'advanced-form', component: AdvancedFormComponent },
  { path: '', redirectTo: 'advanced-form', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
