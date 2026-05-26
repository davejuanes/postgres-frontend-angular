import { Component } from '@angular/core';

import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface City {
  name: string;
  code: string;
}

@Component({
  standalone: true,
  selector: 'app-usuarios',
  imports: [
    SelectModule,
    FormsModule
  ],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss'],
})
export class Usuarios {
  cities: City[];
  selectedCity: City | undefined;

  constructor() {
    this.cities = [
      { name: 'New York', code: 'NY' },
      { name: 'Rome', code: 'RM' },
      { name: 'London', code: 'LDN' },
      { name: 'Istanbul', code: 'IST' },
      { name: 'Paris', code: 'PRS' }
    ];
  }
}
