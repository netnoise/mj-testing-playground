import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const BRAND_MODELS: Readonly<Record<string, readonly string[]>> = {
  Toyota: ['Corolla', 'Camry', 'RAV4'],
  Honda: ['Civic', 'Accord', 'CR-V'],
  Ford: ['Focus', 'Fiesta', 'Kuga'],
};

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly brand = new BehaviorSubject<string | null>(null);

  readonly brands: readonly string[] = Object.keys(BRAND_MODELS);

  readonly models$: Observable<readonly string[]> = this.brand.pipe(
    map((brand) => (brand && BRAND_MODELS[brand]) || [])
  );

  selectBrand(brand: string | null): void {
    this.brand.next(brand);
  }
}
