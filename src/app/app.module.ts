import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AdvancedFormComponent } from './advanced-form/advanced-form.component';
import { BrandSelectComponent } from './vehicle/brand-select.component';
import { ModelListComponent } from './vehicle/model-list.component';

@NgModule({
  declarations: [
    AppComponent,
    AdvancedFormComponent,
    BrandSelectComponent,
    ModelListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
