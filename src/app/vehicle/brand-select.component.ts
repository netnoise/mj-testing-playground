import { Component } from '@angular/core';
import { VehicleService } from './vehicle.service';

@Component({
  selector: 'app-brand-select',
  templateUrl: './brand-select.component.html',
  styleUrls: ['./brand-select.component.sass'],
})
export class BrandSelectComponent {
  readonly brands: readonly string[] = this.vehicle.brands;

  constructor(private readonly vehicle: VehicleService) {}

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.vehicle.selectBrand(value || null);
  }
}
