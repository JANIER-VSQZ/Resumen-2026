import { DEPARTMENTS, normalize } from './content.js';

export function geometryBounds(features) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  function scan(coordinates) {
    if (typeof coordinates?.[0] === 'number') {
      if (!Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) throw Error('Coordenadas no válidas.');
      x0 = Math.min(x0, coordinates[0]); y0 = Math.min(y0, coordinates[1]);
      x1 = Math.max(x1, coordinates[0]); y1 = Math.max(y1, coordinates[1]);
    } else if (Array.isArray(coordinates)) coordinates.forEach(scan);
    else throw Error('Geometría no válida.');
  }
  features.forEach(feature => scan(feature.geometry?.coordinates));
  if (![x0, y0, x1, y1].every(Number.isFinite) || x0 === x1 || y0 === y1) throw Error('El mapa no contiene límites válidos.');
  return [x0, y0, x1, y1];
}

export function prepareMap(geo) {
  const [x0, y0, x1, y1] = geometryBounds(geo.features);
  const width = 1000, height = 635, pad = 25;
  const scale = Math.min((width - 2 * pad) / (x1 - x0), (height - 2 * pad) / (y1 - y0));
  const dx = (width - (x1 - x0) * scale) / 2, dy = (height - (y1 - y0) * scale) / 2;
  const project = ([x, y]) => [dx + (x - x0) * scale, height - dy - (y - y0) * scale];
  const ring = coordinates => coordinates.map((point, index) => `${index ? 'L' : 'M'}${project(point).map(value => value.toFixed(2)).join(',')}`).join(' ') + 'Z';
  return geo.features.map((feature, index) => {
    const raw = feature.properties?.shapeName || feature.properties?.NAME_1 || feature.properties?.name;
    const name = normalize(raw) === 'bayislands' ? 'Islas de la Bahía' : DEPARTMENTS.find(name => normalize(name) === normalize(raw));
    if (!name || !['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) throw Error('El mapa debe contener departamentos de Honduras.');
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const path = polygons.map(polygon => polygon.map(ring).join(' ')).join(' ');
    const [fx0, fy0, fx1, fy1] = geometryBounds([feature]);
    const [x, y] = project([fx0, fy1]), [right, bottom] = project([fx1, fy0]);
    // Use the largest outer ring for labels (instead of the bounding box of distant islands).
    let largest = { area: 0, point: [x + (right - x) / 2, y + (bottom - y) / 2] };
    polygons.forEach(polygon => {
      const points = polygon[0].map(project);
      let area = 0, cx = 0, cy = 0;
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        const cross = a[0] * b[1] - b[0] * a[1];
        area += cross; cx += (a[0] + b[0]) * cross; cy += (a[1] + b[1]) * cross;
      }
      if (Math.abs(area) > largest.area) largest = { area: Math.abs(area), point: [cx / (3 * area), cy / (3 * area)] };
    });
    return { key: index, name, path, center: largest.point, bounds: { x, y, width: right - x, height: bottom - y } };
  });
}

export function validateGeo(geo) {
  if (geo?.type !== 'FeatureCollection' || geo.features?.length !== 18) throw Error('Se necesita un mapa con los 18 departamentos de Honduras.');
  const prepared = prepareMap(geo);
  if (new Set(prepared.map(feature => feature.name)).size !== 18) throw Error('Cada departamento debe aparecer una sola vez.');
  const [x0, y0, x1, y1] = geometryBounds(geo.features);
  if (x0 < -90 || x1 > -82 || y0 < 12 || y1 > 18) throw Error('Las coordenadas no corresponden a Honduras.');
  return geo;
}
