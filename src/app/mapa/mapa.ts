import { AfterViewInit, Component, inject, NgZone, signal, ViewChild } from '@angular/core';

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

// 8va Clase
import { WmsWfs } from './modals/wms-wfs/wms-wfs';

@Component({
  selector: 'app-mapa',
  imports: [Footer, ButtonModule, TooltipModule, TabsModule, DialogModule, WmsWfs],
  templateUrl: './mapa.html',
})
export class Mapa implements AfterViewInit {
  private readonly servicioMapa = inject(MapaService);
  private readonly servicioGeometria = inject(GeometriaService);

  // Declaramos la instancia del mapa
  // private mapa!: L.Map;
  public mapa!: L.Map;

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
    setTimeout(() => {
      this.iniciarMapa();
      // this.mostrarDepartamentos();
      // this.mostrarMunicipios(2);
      // this.mostrarEntidadesBancarias();
    });
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

  // Modal WMS / WFS
  @ViewChild('wmswfs') wmswfs!: WmsWfs;
  abrirModalWmsWfs() {
    // console.log(' abrir modal');
    this.wmswfs.abrirModal();
  }

  // Métodos de Medición de Distancia (Puntos) y Área
  private setCursorStyle(cursor: string) {
    const container = (this.mapa as any)._container as HTMLElement;
    if (container) {
      container.style.cursor = cursor;
    }
  }

  // Variables para medición de distancia
  private estadoMedirPunto = false;
  private clickListenerPunto: any = null;
  private markersPuntos: L.Marker[] = [];
  private lineaPuntos: L.Polyline | null = null;
  public puntos: { latitud: number; longitud: number; }[] = [];

  // Variables para medición de área
  public estadoMedirArea = false;
  private latLngsArea: L.LatLng[] = [];
  private polygonArea: L.Polygon | null = null;
  private markersArea: L.Marker[] = [];
  private clickListenerArea: any = null;
  private dblClickListenerArea: any = null;
  private tooltipArea: L.Tooltip | null = null;

  // Habilitar / deshabilitar medición de distancias
  public activarMedicionPunto(): void {
    if (this.estadoMedirArea) {
      this.desactivarMedicionArea();
    }

    if (this.estadoMedirPunto) {
      this.desactivarMedicionPunto();
      console.log('Medición de punto deshabilitada');
    } else {
      this.estadoMedirPunto = true;
      this.iniciarMedicionPunto();
      console.log('Medición de punto habilitada');
    }
  }

  private iniciarMedicionPunto(): void {
    this.setCursorStyle('crosshair');
    this.clickListenerPunto = (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      let distanciaTramo = 0;
      let distanciaAcumulada = 0;

      if (this.puntos.length > 0) {
        const ultimoPunto = this.puntos[this.puntos.length - 1];
        distanciaTramo = L.latLng(ultimoPunto.latitud, ultimoPunto.longitud).distanceTo(L.latLng(lat, lng));
        
        for (let i = 1; i < this.puntos.length; i++) {
          const p1 = L.latLng(this.puntos[i - 1].latitud, this.puntos[i - 1].longitud);
          const p2 = L.latLng(this.puntos[i].latitud, this.puntos[i].longitud);
          distanciaAcumulada += p1.distanceTo(p2);
        }
        distanciaAcumulada += distanciaTramo;
      }

      this.puntos.push({
        latitud: lat,
        longitud: lng
      });

      const distanciaTramoKm = distanciaTramo / 1000;
      const distanciaAcumuladaKm = distanciaAcumulada / 1000;

      const marker = L.marker([lat, lng])
        .addTo(this.mapa)
        .bindPopup(`
          <b>Punto ${this.puntos.length}</b><br>
          Lat: ${lat.toFixed(6)}<br>
          Lng: ${lng.toFixed(6)}<br>
          Distancia tramo: ${distanciaTramoKm.toFixed(3)} km<br>
          Distancia acumulada: ${distanciaAcumuladaKm.toFixed(3)} km
        `);
      marker.openPopup();
      this.markersPuntos.push(marker);

      const coordenadas: [number, number][] = this.puntos.map(p => [p.latitud, p.longitud]);

      if (this.lineaPuntos) {
        this.mapa.removeLayer(this.lineaPuntos);
      }

      this.lineaPuntos = L.polyline(coordenadas, {
        color: 'red',
        weight: 3
      }).addTo(this.mapa);
    };

    this.mapa.on('click', this.clickListenerPunto);
  }

  private desactivarMedicionPunto(): void {
    if (this.clickListenerPunto) {
      this.mapa.off('click', this.clickListenerPunto);
      this.clickListenerPunto = null;
    }

    this.markersPuntos.forEach(marker => this.mapa.removeLayer(marker));
    this.markersPuntos = [];

    if (this.lineaPuntos) {
      this.mapa.removeLayer(this.lineaPuntos);
      this.lineaPuntos = null;
    }

    this.puntos = [];
    this.setCursorStyle('');
    this.estadoMedirPunto = false;
  }

  // Habilitar / deshabilitar medición de área
  public activarMedicionArea(): void {
    if (this.estadoMedirPunto) {
      this.desactivarMedicionPunto();
    }

    if (this.estadoMedirArea) {
      this.desactivarMedicionArea();
      console.log('Medición de área deshabilitada');
    } else {
      this.estadoMedirArea = true;
      this.iniciarMedicionArea();
      console.log('Medición de área habilitada');
    }
  }

  private iniciarMedicionArea(): void {
    this.setCursorStyle('crosshair');
    this.latLngsArea = [];
    this.markersArea = [];

    this.clickListenerArea = (e: L.LeafletMouseEvent) => {
      const point = e.latlng;
      this.latLngsArea.push(point);

      const marker = L.marker([point.lat, point.lng])
        .addTo(this.mapa)
        .bindPopup(`Vértice ${this.latLngsArea.length}`);
      this.markersArea.push(marker);

      if (this.latLngsArea.length >= 3) {
        if (this.polygonArea) {
          this.mapa.removeLayer(this.polygonArea);
        }
        this.polygonArea = L.polygon(this.latLngsArea, {
          color: 'green',
          fillColor: '#22c55e',
          fillOpacity: 0.3,
          weight: 2
        }).addTo(this.mapa);

        const areaM2 = this.calcularAreaPoligono(this.latLngsArea);
        const areaText = areaM2 > 1000000 
          ? `${(areaM2 / 1000000).toFixed(3)} km²` 
          : `${areaM2.toFixed(2)} m²`;

        if (this.tooltipArea) {
          this.mapa.removeLayer(this.tooltipArea);
        }

        const bounds = this.polygonArea.getBounds();
        this.tooltipArea = L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'area-tooltip'
        })
        .setContent(`Área: ${areaText}`)
        .setLatLng(bounds.getCenter())
        .addTo(this.mapa);
      }
    };

    this.dblClickListenerArea = () => {
      this.finalizarMedicionArea();
      console.log('Polígono de área finalizado');
    };

    this.mapa.on('click', this.clickListenerArea);
    this.mapa.on('dblclick', this.dblClickListenerArea);
  }

  private finalizarMedicionArea(): void {
    if (this.clickListenerArea) {
      this.mapa.off('click', this.clickListenerArea);
      this.clickListenerArea = null;
    }
    if (this.dblClickListenerArea) {
      this.mapa.off('dblclick', this.dblClickListenerArea);
      this.dblClickListenerArea = null;
    }
    this.setCursorStyle('');
  }

  private desactivarMedicionArea(): void {
    this.finalizarMedicionArea();

    if (this.polygonArea) {
      this.mapa.removeLayer(this.polygonArea);
      this.polygonArea = null;
    }

    if (this.tooltipArea) {
      this.mapa.removeLayer(this.tooltipArea);
      this.tooltipArea = null;
    }

    this.markersArea.forEach(marker => this.mapa.removeLayer(marker));
    this.markersArea = [];
    this.latLngsArea = [];
    this.estadoMedirArea = false;
  }

  // Fórmula matemática para calcular el área de un polígono geodésico en m²
  private calcularAreaPoligono(latLngs: L.LatLng[]): number {
    const radioTierra = 6378137; // en metros
    let area = 0;

    if (latLngs.length > 2) {
      for (let i = 0; i < latLngs.length; i++) {
        const p1 = latLngs[i];
        const p2 = latLngs[(i + 1) % latLngs.length];

        const lat1 = p1.lat * Math.PI / 180;
        const lat2 = p2.lat * Math.PI / 180;
        const lon1 = p1.lng * Math.PI / 180;
        const lon2 = p2.lng * Math.PI / 180;

        area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
      }
      area = area * radioTierra * radioTierra / 2.0;
    }
    return Math.abs(area);
  }
}
