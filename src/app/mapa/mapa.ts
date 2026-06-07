import { AfterViewInit, Component, inject, NgZone, signal } from '@angular/core';

import * as L from 'leaflet';
import { Footer } from './footer/footer';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';

// Mapa base
import { BASE_MAPAS_CONFIG } from '../config/tipos_mapa';

// Servicios
import { MapaService } from '../servicios/mapa.service';
import { catchError, of, tap } from 'rxjs';
import { GeometriaService } from '../servicios/geometria.service';

@Component({
  selector: 'app-mapa',
  imports: [Footer, ButtonModule, TooltipModule, TabsModule, DialogModule],
  templateUrl: './mapa.html',
})
export class Mapa implements AfterViewInit {
  private readonly servicioMapa = inject(MapaService);
  private readonly servicioGeometria = inject(GeometriaService);

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
    // this.mostrarDepartamentos();
    // this.mostrarMunicipios(2);
    // this.mostrarEntidadesBancarias();
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

  // Para las capas almacenadas
  capasGeoJSONAlmacenadas: { id: string; capa: L.LayerGroup; visible: boolean }[] = [];

  // Para gestionar las capas
  private gestionarCapa(
    id: string,
    datos: any[],
    opcionesPunto?: any,
    opcionesPoligono?: any,

    alHacerClick?: (elemento: any) => void,
    campoNombre?: string,
  ): void {
    const { capa, limites } = this.servicioGeometria.dibujarGeometria(
      datos,
      opcionesPunto,
      opcionesPoligono,

      alHacerClick,
      campoNombre,
    );

    capa.addTo(this.mapa);

    // Se guardan las capas almacenadas
    this.capasGeoJSONAlmacenadas.push({ id, capa, visible: true });

    console.log(`Capa ${id} agregada`);

    if (limites.isValid()) {
      this.mapa.fitBounds(limites, { padding: [40, 40] });
    }
  }

  // Para eliminar capa almacenada
  eliminarCapa(id: string) {
    // Buscamos la capa
    const indice = this.capasGeoJSONAlmacenadas.findIndex((c) => c.id === id);

    if (indice === -1) {
      console.warn(`Capa "${id}" no encontrada`);

      // Eliminamos la capa del mapa
      /* this.mapa.removeLayer(this.capasGeoJSONAlmacenadas[indice].capa);

      // Eliminamos la capa de la lista
      this.capasGeoJSONAlmacenadas.splice(indice, 1);

      console.log(`Capa ${id} eliminada`); */
    }

    // Eliminamos la capa
    this.capasGeoJSONAlmacenadas[indice].capa.remove();
    this.capasGeoJSONAlmacenadas.splice(indice, 1);

    console.log(`La capa almacenada eliminada "${id}"`);
  }

  // Para el estado visible de la capa
  estadoVisibleCapa(item: { id: string; capa: L.LayerGroup; visible: boolean }) {
    if (item.visible) {
      item.capa.remove();
      item.visible = false;
    } else {
      item.capa.addTo(this.mapa);
      item.visible = true;
    }
  }

  // Prueba
  mostrarDepartamentos() {
    this.servicioMapa
      .listarDepartamentos()
      .pipe(
        tap((resp: any) => {
          // console.log(resp);

          this.gestionarCapa(
            'departamentos',
            resp,
            null,
            { grosor: 1 },
            (elemento: any) => this.mostrarMunicipios(elemento),
            'departamento',
          );
        }),
        catchError((err) => {
          console.log(err);
          return of([]);
        }),
      )
      .subscribe();
  }

  mostrarMunicipios(datos: any) {
    const { cod_dep } = datos;

    this.servicioMapa
      .listarMunicipios(cod_dep)
      .pipe(
        tap((resp: any) => {
          // console.log(resp);

          this.gestionarCapa('municipios', resp, null, { grosor: 1 }, (elemento) =>
            this.mostrarInformacion(elemento),
          );
        }),
        catchError((err) => {
          console.log(err);
          return of([]);
        }),
      )
      .subscribe();
  }

  visibleMunicipio = signal(false);
  datosMunicipio = signal<any>([]);

  mostrarInformacion(datos: any) {
    this.visibleMunicipio.set(true);
    this.datosMunicipio.set(datos);
  }

  // Custom Icon
  iconoBanco = {
    iconUrl: '/bank.png',
    iconSize: [20, 20],
    iconAnchor: [12, 20],
    popupAnchor: [0, -35],
  };

  // Mostrar entidades bancarias
  mostrarEntidadesBancarias() {
    this.servicioMapa
      .listarEntidadesBancarias()
      .pipe(
        tap((resp: any) => {
          // console.log(resp);

          this.gestionarCapa('entidades-bancarias', resp, this.iconoBanco);
        }),
        catchError((err) => {
          console.log(err);
          return of([]);
        }),
      )
      .subscribe();
  }
}
