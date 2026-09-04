import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs/operators';
import { VehicleService } from './vehicle.service';

describe('VehicleService', () => {
  let service: VehicleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VehicleService);
  });

  it('emits no models before a brand is selected', (done) => {
    service.models$.pipe(take(1)).subscribe((models) => {
      expect(models).toEqual([]);
      done();
    });
  });

  it('emits that brand\'s models when a known brand is selected', (done) => {
    service.selectBrand('Toyota');
    service.models$.pipe(take(1)).subscribe((models) => {
      expect(models).toContain('Corolla');
      done();
    });
  });

  it('clears the model list when an unrecognized brand is selected', (done) => {
    service.selectBrand('Toyota');
    service.selectBrand('NotARealBrand');
    service.models$.pipe(take(1)).subscribe((models) => {
      expect(models).toEqual([]);
      done();
    });
  });
});
