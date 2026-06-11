import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WmsWfsService {
  private http = inject(HttpClient);

  getCapabilities(url: string) {
    const endpoint = `${url}?service=WMS&request=GetCapabilities`;

    return this.http
      .get(endpoint, { responseType: 'text' })
      .pipe(map((xml) => this.parsearCapasWMS(xml)));
  }

  private parsearCapasWMS(xml: string) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    const layers = xmlDoc.querySelectorAll('Layer Layer');

    return Array.from(layers)
      .map((layer) => ({
        nombre: layer.querySelector('Name')?.textContent,
        titulo: layer.querySelector('Title')?.textContent,
      }))
      .filter((c) => c.nombre);
  }

  getWFS(url: string, layer: string) {
    const endpoint = `$(url)?service=WFS&version=1.0.0&request=GetFeature&typename=${layer}&outputformat=application/json`;
    return this.http.get(endpoint);
  }
}
