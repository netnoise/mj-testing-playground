import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrandSelectComponent } from './vehicle/brand-select.component';
import { ModelListComponent } from './vehicle/model-list.component';

@NgModule({
  declarations: [
    AppComponent,
    BrandSelectComponent,
    ModelListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
