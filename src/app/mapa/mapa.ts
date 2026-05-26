import { AfterViewInit, Component, inject, NgZone, signal } from '@angular/core';

import * as L from 'leaflet';
import { Footer } from "./footer/footer";

@Component({
  selector: 'app-mapa',
  imports: [Footer],
  templateUrl: './mapa.html',
  styleUrl: './mapa.scss',
})
export class Mapa implements AfterViewInit {

  // Declaramos la instancia del mapa
  private mapa!: L.Map;

  // Para controlar el flujo de las operaciones asincronicas
  private zone = inject(NgZone);

  // Para las coordenadas lat y long
  coordenadas = signal({
    latitud: '',
    longitud: ''
  })

  ngAfterViewInit() {
    this.iniciarMapa();
  }

  // Iniciar Mapa
  iniciarMapa() {
    this.mapa = L.map('mapa_v2', {
      center: [-16.493880, -68.092698],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      dragging: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Mapas v2'
    }).addTo(this.mapa);

    this.zone.runOutsideAngular(() => {
      this.mapa.on('mousemove', (e: L.LeafletMouseEvent) => {
        console.log(e.latlng.lat),
        this.coordenadas.set({
          latitud: e.latlng.lat.toString(),
          longitud: e.latlng.lng.toString()
        })
      })
    })
  }

}
