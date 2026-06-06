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
  dibujarGeometria(
    datos: ElementoGeometria[],
    opcionesPunto?: any,
    opcionesPoligono?: any,

    alHacerClick?: (elemento: ElementoGeometria) => void,
    campoNombre?: string,
  ) {
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
          color: '#ffffff',
          fillColor: opcionesPoligono?.colorRelleno ?? color,
          weight: opcionesPoligono?.grosor,
          opacity: opcionesPoligono?.opacidad,
          fillOpacity: opcionesPoligono?.opacidadRelleno ?? 1,
        });

        // Agregar todoslo vertices al calculo del limite del mapa
        multipoligono.flat().forEach((v: any) => limites.extend(v));
      }

      if (layer) {
        // Para contruir el popup
        layer.bindPopup(this.construirPopup(elemento), {
          maxWidth: 400,
        });

        // Hover para mostrar el popup
        layer.on('mouseover', (evento) => {
          // Se obtiene la capa donde va a ocurrir el evento
          const objeto = evento.target;

          objeto.openPopup();

          if (typeof objeto.setStyle === 'function') {
            objeto.setStyle({
              weight: 4,
            });
          }
        });

        layer.on('mouseout', (evento) => {
          const objeto = evento.target;

          // Si el popup esta abierto no se ejecuta el cierre
          // if (objeto.isPopupOpen()) return;

          // Si el popup me esta abierto se cierra
          objeto.closePopup();

          if (typeof objeto.setStyle === 'function') {
            objeto.setStyle({
              weight: opcionesPoligono?.grosor ?? 2,
            });
          }
        });

        // Verificar sit iene la funcionalidad de hacer click
        if (alHacerClick) {
          layer.on('click', (evento) => {
            L.DomEvent.stopPropagation(evento);
            alHacerClick(elemento);
          });
        }

        capa.addLayer(layer);

        if (campoNombre && elemento[campoNombre]) {
          layer.bindTooltip(elemento[campoNombre], {
            permanent: true,
            direction: 'auto',
            className: 'bg-dark text-white px-2 rounded',
            opacity: 0.8,
          });
        }
      }
    });
    return { capa, limites: limites };
  }

  private construirPopup(elemento: ElementoGeometria) {
    // Excluir campos
    const camposExcluidos = new Set(['geom', 'color']);

    const filas = Object.entries(elemento)
      .filter(([clave]) => !camposExcluidos.has(clave))
      .map(([clave, valor]) => {
        // Transformar nombre de campo para el usuario
        const etiqueta = clave.replace(/_/g, ' ').replace(/\b\w/g, (letra) => letra.toUpperCase());

        return `
                        <tr>
                          <td><strong>${etiqueta} :</strong></td>
                          <td>${valor ?? '-'}</td>
                        </tr>
                      `;
      })
      .join('');

    return `
        <table>
          <tbody>
            ${filas}
          </tbody>
        </table>
      `;
  }
}
