import { AfterViewInit, Component, inject, NgZone, signal } from '@angular/core';

import * as L from 'leaflet';
import { Footer } from "./footer/footer";

// PrimeNG
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-mapa',
  imports: [
    Footer,
    ButtonModule
  ],
  templateUrl: './mapa.html'
})
export class Mapa implements AfterViewInit {

  // Declaramos la instancia del mapa
  private mapa!: L.Map;

  // Para controlar el flujo de las operaciones asincronicas
  private zone = inject(NgZone);

  // Para las coordenadas lat y long
  coordenadas = signal<any>({
    latitud: '-16.493880',
    longitud: '-68.092698'
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

        /* onsole.log("Latitud : ", e.latlng.lat),
        console.log("Longitud : ", e.latlng.lng), */
        this.coordenadas.set({
          latitud: e.latlng.lat.toFixed(7),
          longitud: e.latlng.lng.toFixed(7)
        })

      })
    });

  }

  // Herramientas
  acercar() {
    this.mapa.zoomIn();
  }

  alejar() {
    this.mapa.zoomOut();
  }

  miUbicacion() {
    this.mapa.locate({
      enableHighAccuracy: true,
      watch: true,
      maxZoom: 18
    });

    this.mapa.once('locationfound', (e:any) => {
      this.mapa.flyTo(e.latlng, 20)

      L.marker(e.latlng)
        .addTo(this.mapa)
        .bindPopup('Estas Aqui')
        .openPopup();

    })
  }
}
