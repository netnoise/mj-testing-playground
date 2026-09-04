import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleService } from './vehicle.service';
import { ModelListComponent } from './model-list.component';

describe('ModelListComponent', () => {
  let fixture: ComponentFixture<ModelListComponent>;
  let service: VehicleService;

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [ModelListComponent] });
    fixture = TestBed.createComponent(ModelListComponent);
    service = TestBed.inject(VehicleService);
  });

  it('shows an empty-state message before any brand is selected', () => {
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Select a brand');
  });

  it('renders each model for the selected brand', () => {
    service.selectBrand('Toyota');
    fixture.detectChanges();
    const items: NodeListOf<HTMLLIElement> = fixture.nativeElement.querySelectorAll('li');
    const text = Array.from(items).map((li) => li.textContent);
    expect(text).toEqual(expect.arrayContaining(['Corolla', 'Camry', 'RAV4']));
  });

  it('clears the list and shows the empty state again for an unrecognized brand', () => {
    service.selectBrand('Toyota');
    fixture.detectChanges();
    service.selectBrand('NotARealBrand');
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li');
    expect(items.length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Select a brand');
  });
});
