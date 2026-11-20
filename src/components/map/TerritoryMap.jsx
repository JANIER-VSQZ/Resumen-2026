import React, { useEffect, useId, useState } from 'react';
import useMapCamera from '../../hooks/useMapCamera';
import MapDepartment from './MapDepartment';
import MapControls from './MapControls';
import MapFeedback from './MapFeedback';
import MapLegend from './MapLegend';

export default function TerritoryMap({ features, departments, matches, hovered, onHover, onOpen, selected, selectionLocked = false, projectMode = false }) {
  const idPrefix = 'map-' + useId().replace(/:/g, '') + '-';
  const [labels, setLabels] = useState(true);
  const [failed, setFailed] = useState(() => new Set());
  const canSelect = name => matches(name) && (!selectionLocked || name === selected);
  const { camera, svgRef, viewBox, zoom, reset, pointerHandlers } = useMapCamera({ features, matches: canSelect, onOpen });
  useEffect(() => setFailed(new Set()), [features]);
  const activeFeature = features.find(feature => feature.name === hovered && matches(feature.name));

  console.log(departments);
  return (
    <div className={'map-panel' + (projectMode ? ' project-territory-map' : '')}>
      <div className="map-toolbar">
        <label className="map-labels"><input type="checkbox" checked={labels} onChange={event => setLabels(event.target.checked)} /> Nombres</label>
      </div>
      <div className={'map-stage' + (camera.zoom > 1 ? ' is-zoomed' : '') + (camera.zoom >= 2 ? ' show-mobile-labels' : '')}>
        <svg ref={svgRef} className="honduras-map" viewBox={viewBox} role="group" aria-label={projectMode ? (selectionLocked ? 'Mapa de cobertura del proyecto en Honduras. Departamento consultado: ' + selected + '. Usa los controles para ampliar y arrastra para desplazarte.' : 'Mapa de cobertura del proyecto en Honduras. Los departamentos resaltados muestran sus actividades al seleccionarlos.') : 'Mapa interactivo de Honduras. Usa los controles para ampliar y arrastra para desplazarte.'} {...pointerHandlers}>
          <defs>{features.map(feature => <clipPath id={idPrefix + 'dept-' + feature.key} key={feature.key}><path d={feature.path} fillRule="evenodd" /></clipPath>)}</defs>
          {features.map(feature => (
            <MapDepartment
              key={feature.key}
              feature={feature}
              idPrefix={idPrefix}
              department={departments[feature.name]}
              visible={matches(feature.name)}
              selectable={canSelect(feature.name)}
              hovered={hovered === feature.name}
              selected={selected === feature.name}
              projectMode={projectMode}
              labels={labels}
              zoom={camera.zoom}
              failedSources={failed}
              onPhotoError={src => setFailed(previous => new Set(previous).add(src))}
              onHover={onHover}
              onOpen={onOpen}
            />
          ))}
          {activeFeature && <use className="department-hover-overlay" href={'#' + idPrefix + 'visual-' + activeFeature.key} aria-hidden="true" focusable="false" />}
        </svg>
        <MapControls zoom={camera.zoom} onZoom={zoom} onReset={reset} />
        <MapFeedback hovered={hovered} departments={departments} matches={matches} />
      </div>
      <MapLegend projectMode={projectMode} />
    </div>
  );
}
