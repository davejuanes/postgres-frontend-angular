import { Injectable } from '@angular/core';
import * as L from 'leaflet';

// tipo geom: Formato de GeoJSON (desde la base de datos)
// clave: cod_dep, departamento (popup)
interface ElementoGeometria {
  geom: string;
  [clave: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class GeometriaService {
  dibujarGeometria(datos: ElementoGeometria[], opcionesPunto?: any, opcionesPoligono?: any) {
    // Contendra las geometrias dibujadas
    const capa = L.layerGroup();
    // Limites geograficos de todas las geometrias
    const limites = L.latLngBounds([]);

    datos.forEach((elemento: ElementoGeometria) => {
      if (!elemento.geom) return;

      let geometria: any;

      try {
        geometria = typeof elemento.geom === 'string' ? JSON.parse(elemento.geom) : elemento.geom;
      } catch (error) {
        console.error('Geometria invalida, se omite el elemento ', elemento, error);
        return;
      }

      // Obtener el tipo de geometria que esta llegando
      const tipoGeometria = geometria.type;
      console.log(tipoGeometria);

      // Coordenadas de la geometria
      const coordenadas = geometria.coordinates;

      // Variable donde se guardara la capa
      let layer: L.Layer | undefined;

      // Punto

      // Poligono

      // Multipoligono
      if (tipoGeometria === 'MultiPolygon') {
        // Convertimos las coordenadas de todos los poligonos en formato leaflet
        const multipoligono = coordenadas.map((poligono: any) =>
          poligono[0].map((c: number[]) => [c[1], c[0]]),
        );

        const color = opcionesPoligono?.color ?? elemento['color'] ?? '#3b8246';

        layer = L.polygon(multipoligono, {
          color: color,
          fillColor: opcionesPoligono?.colorRelleno ?? color,
          weight: opcionesPoligono?.grosor,
          opacity: opcionesPoligono?.opacidad,
          fillOpacity: opcionesPoligono?.opacidadRelleno ?? 1,
        });

        // Agregar todoslo vertices al calculo del limite del mapa
        multipoligono.flat().forEach((v: any) => limites.extend(v));
      }
    });
    return { capa, limites: limites };
  }
}
