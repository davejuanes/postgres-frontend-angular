import { AfterViewInit, Component, inject, NgZone, signal } from '@angular/core';

import * as L from 'leaflet';
import { Footer } from './footer/footer';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';

// Mapa base
import { BASE_MAPAS_CONFIG } from '../config/tipos_mapa';

// Servicios
import { MapaService } from '../servicios/mapa.service';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-mapa',
  imports: [Footer, ButtonModule, TooltipModule, TabsModule],
  templateUrl: './mapa.html',
})
export class Mapa implements AfterViewInit {
  private readonly servicioMapa = inject(MapaService);

  // Declaramos la instancia del mapa
  private mapa!: L.Map;

  // Selección de mapa
  private mapaBaseActual?: L.TileLayer;

  // Identificador mapa base
  mapaSeleccionadoId: string = 'streets1';

  // Lista de mapas base disponibles
  readonly mapas_base = BASE_MAPAS_CONFIG;

  // Para controlar el flujo de las operaciones asincronicas
  private zone = inject(NgZone);

  // Para las coordenadas lat y long
  coordenadas = signal<any>({
    latitud: '-16.493880',
    longitud: '-68.092698',
  });

  // Menus
  activeTab: string = 'menu';

  ngAfterViewInit() {
    this.iniciarMapa();
    this.mostrarDepartamentos();
  }

  // Iniciar Mapa
  iniciarMapa() {
    this.mapa = L.map('mapa_v2', {
      center: [-16.49388, -68.092698],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
      dragging: true,
    });

    /* L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Mapas v2',
    }).addTo(this.mapa); */
    setTimeout(() => {
      this.cambiarMapasBase(this.mapas_base[0]);
    });

    this.zone.runOutsideAngular(() => {
      this.mapa.on('mousemove', (e: L.LeafletMouseEvent) => {
        /* onsole.log("Latitud : ", e.latlng.lat),
        console.log("Longitud : ", e.latlng.lng), */
        this.coordenadas.set({
          latitud: e.latlng.lat.toFixed(7),
          longitud: e.latlng.lng.toFixed(7),
        });
      });
    });
  }

  // Para cambiar el tipo de mapa base
  cambiarMapasBase(config: any) {
    // guardamos el mapa base que esta llegando
    this.mapaSeleccionadoId = config.id;

    // Si ya existe un mapa base lo eliminamos
    if (this.mapaBaseActual) {
      this.mapa.removeLayer(this.mapaBaseActual);
    }

    // Agregamos el nuevo mapa base
    this.mapaBaseActual = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 18,
    }).addTo(this.mapa);
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
      maxZoom: 18,
    });

    this.mapa.once('locationfound', (e: any) => {
      this.mapa.flyTo(e.latlng, 20);

      L.marker(e.latlng).addTo(this.mapa).bindPopup('Estas Aqui').openPopup();
    });
  }

  // Prueba
  mostrarDepartamentos() {
    this.servicioMapa
      .listarDepartamentos()
      .pipe(
        tap((resp: any) => {
          console.log(resp);
        }),
        catchError((err) => {
          console.log(err);
          return of([]);
        }),
      )
      .subscribe();
  }
}
