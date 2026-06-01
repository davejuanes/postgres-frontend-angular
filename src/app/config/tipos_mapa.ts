export const BASE_MAPAS_CONFIG = [
  {
    id: 'streets1',
    nombre: 'Calles - 1',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    imagen: 'https://a.basemaps.cartocdn.com/light_all/7/63/42.png',
    atributo: 'OpenStreetMap',
  },
  {
    id: 'streets',
    nombre: 'Calles',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    imagen: 'https://b.tile.openstreetmap.org/7/63/42.png',
    atributo: 'OpenStreetMap',
  },
  {
    id: 'satellite',
    nombre: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    imagen:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/5/9',
    atributo: 'Satelite',
  },
];
