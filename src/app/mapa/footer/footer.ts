import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html'
})
export class Footer {

  @Input() latitud_fot!: string;
  @Input() longitud_fot!: string;
}
