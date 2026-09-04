import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleService } from './vehicle.service';
import { BrandSelectComponent } from './brand-select.component';

describe('BrandSelectComponent', () => {
  let fixture: ComponentFixture<BrandSelectComponent>;
  let service: VehicleService;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [BrandSelectComponent] });
    fixture = TestBed.createComponent(BrandSelectComponent);
    service = TestBed.inject(VehicleService);
    fixture.detectChanges();
  });

  it('lists every brand the service knows about as an option', () => {
    const options: NodeListOf<HTMLOptionElement> = fixture.nativeElement.querySelectorAll('option');
    const labels = Array.from(options).map((o) => o.value);
    expect(labels).toEqual(expect.arrayContaining([...service.brands]));
  });

  it('tells the service which brand was picked', () => {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    const spy = jest.spyOn(service, 'selectBrand');
    select.value = service.brands[0];
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith(service.brands[0]);
  });
});
