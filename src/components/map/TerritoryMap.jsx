import React, { useEffect, useState } from 'react';
import useMapCamera from '../../hooks/useMapCamera';
import MapDepartment from './MapDepartment';
import MapControls from './MapControls';
import MapFeedback from './MapFeedback';
import MapLegend from './MapLegend';

export default function TerritoryMap({ features, departments, filters, matches, hovered, onHover, onOpen, preview, onClosePreview }) {
  const [labels, setLabels] = useState(true);
  const [failed, setFailed] = useState(() => new Set());
  const { camera, svgRef, viewBox, zoom, reset, pointerHandlers } = useMapCamera({ features, matches, onOpen });
  useEffect(() => setFailed(new Set()), [features]);
  const activeFeature = features.find(feature => feature.name === hovered && matches(feature.name));

  return (
    <div className="map-panel">
      <div className="map-toolbar">
        <label className="map-labels"><input type="checkbox" checked={labels} onChange={event => setLabels(event.target.checked)} /> Nombres</label>
      </div>
      <div className={'map-stage' + (camera.zoom > 1 ? ' is-zoomed' : '') + (camera.zoom >= 2 ? ' show-mobile-labels' : '')}>
        <svg ref={svgRef} className="honduras-map" viewBox={viewBox} role="group" aria-label="Mapa interactivo de Honduras. Usa los controles para ampliar y arrastra para desplazarte." {...pointerHandlers}>
          <defs>{features.map(feature => <clipPath id={'dept-' + feature.key} key={feature.key}><path d={feature.path} fillRule="evenodd" /></clipPath>)}</defs>
          {features.map(feature => (
            <MapDepartment
              key={feature.key}
              feature={feature}
              department={departments[feature.name]}
              visible={matches(feature.name)}
              hovered={hovered === feature.name}
              labels={labels}
              zoom={camera.zoom}
              filters={filters}
              failedSources={failed}
              onPhotoError={src => setFailed(previous => new Set(previous).add(src))}
              onHover={onHover}
              onOpen={onOpen}
            />
          ))}
          {activeFeature && <use className="department-hover-overlay" href={'#map-visual-' + activeFeature.key} aria-hidden="true" focusable="false" />}
        </svg>
        <MapControls zoom={camera.zoom} onZoom={zoom} onReset={reset} />
        <MapFeedback hovered={hovered} preview={preview} departments={departments} filters={filters} matches={matches} onClosePreview={onClosePreview} />
      </div>
      <MapLegend />
    </div>
  );
}
