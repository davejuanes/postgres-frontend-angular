import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MapaService {
  // Declaramosla base URL
  urlBase = environment.apiUrl;

  http = inject(HttpClient);

  listarDepartamentos() {
    return this.http.get<any>(`${this.urlBase}/mapa/listar`);
  }
}
