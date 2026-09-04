import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { VehicleService } from './vehicle.service';

@Component({
  selector: 'app-model-list',
  templateUrl: './model-list.component.html',
  styleUrls: ['./model-list.component.sass'],
})
export class ModelListComponent {
  readonly models$: Observable<readonly string[]> = this.vehicle.models$;

  constructor(private readonly vehicle: VehicleService) {}
}
