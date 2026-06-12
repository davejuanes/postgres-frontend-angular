import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

// Servicios
import { WmsWfsService } from '../../../servicios/wms-wfs.service';

// Prime NG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-wms-wfs',
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    TabsModule,
    FormsModule,
    InputTextModule,
    FloatLabel,
    InputGroup,
    InputGroupAddonModule,
    SelectModule,
    TooltipModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './wms-wfs.html',
  styleUrl: './wms-wfs.scss',
})
export class WmsWfs {
  @Input() mapa!: L.Map;
  public wms_wfs_modal: boolean = false;
  public tabActivo: string = 'buscar';
  public selectedLayer: any;
  private wmswfsService = inject(WmsWfsService);
  public progresionbar: boolean = false;
  public resultado = signal<any[]>([]);
  public busqueda: string = '';

  public abrirModal() {
    this.wms_wfs_modal = true;
  }

  private limpiarUrl(url: string): string {
    const i = url.indexOf('?');
    return i !== -1 ? url.substring(0, i) : url;
  }

  public buscar() {
    this.progresionbar = true;
    this.busqueda = this.limpiarUrl(this.busqueda);
    this.wmswfsService.getCapabilities(this.busqueda).subscribe((resp: any) => {
      const capa = resp.map((c: any) => ({
        label: c.titulo,
        value: c.nombre,
      }));
      console.log('Capa WMS', capa);
      this.resultado.set(capa);
      this.progresionbar = false;
    });
  }

  private wmsLayerActual?: L.TileLayer.WMS;

  public agregarWmsDesdeLista(layer: any) {
    console.log('agregarWmsDesdeLista - Iniciando carga de capa:', layer);
    console.log('agregarWmsDesdeLista - URL de búsqueda:', this.busqueda);
    console.log('agregarWmsDesdeLista - Instancia del mapa:', this.mapa);

    if (!layer) {
      console.warn('agregarWmsDesdeLista - El objeto de la capa es nulo o indefinido.');
      return;
    }

    const layerName = layer.value || layer;
    if (!layerName) {
      console.warn('agregarWmsDesdeLista - No se pudo obtener el nombre de la capa (layer.value).');
      return;
    }

    if (!this.mapa) {
      console.error('agregarWmsDesdeLista - Error: El mapa no está definido o inicializado.');
      return;
    }

    if (this.wmsLayerActual) {
      console.log('agregarWmsDesdeLista - Removiendo capa anterior:', this.wmsLayerActual);
      this.mapa.removeLayer(this.wmsLayerActual);
    }
    
    try {
      console.log('agregarWmsDesdeLista - Creando capa WMS para:', layerName);
      const wmsLayer = L.tileLayer.wms(this.busqueda, {
        layers: layerName,
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
      });
      wmsLayer.addTo(this.mapa);
      this.wmsLayerActual = wmsLayer;
      console.log('agregarWmsDesdeLista - Capa agregada con éxito:', wmsLayer);
    } catch (error) {
      console.error('agregarWmsDesdeLista - Error al agregar la capa WMS:', error);
    }
  }
}
