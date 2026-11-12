import React, { useId, useState } from 'react';
import { orderedPhotos } from '../../content';
import useMapHover from '../../hooks/useMapHover';

export default function MapPreview({ features, departments, hasContent, onExplore }) {
  const clipId = 'home-map-' + useId().replace(/:/g, '');
  const [failedSources, setFailedSources] = useState(() => new Set());
  const { ref, ...pointerHandlers } = useMapHover();

  return <div className="cover-map-preview" ref={ref}>
    <button className="map-preview-open" onClick={onExplore} aria-label="Abrir el mapa interactivo de Honduras" {...pointerHandlers}>
      {features ? <svg className="map-preview-svg" viewBox="0 0 1000 635" role="img" aria-label="Mapa de Honduras con fotografías en los departamentos con contenido verificado">
        <defs>{features.map(feature => <clipPath id={clipId + '-' + feature.key} key={feature.key}>
          <path d={feature.path} clipRule="evenodd" />
        </clipPath>)}</defs>
        {features.map(feature => {
          const verified = hasContent(feature.name);
          const photo = verified && orderedPhotos(departments?.[feature.name]?.photos).find(photo => photo.src && !failedSources.has(photo.src));

          return <g className={'preview-department' + (verified ? ' has-content' : '') + (departments?.[feature.name]?.demo ? ' is-demo' : '')} key={feature.key}>
            <title>{feature.name}</title>
            <path className="preview-dept-base" d={feature.path} fillRule="evenodd" />
            {photo && feature.bounds && <image
              href={photo.thumbnail || photo.src}
              x={feature.bounds.x}
              y={feature.bounds.y}
              width={feature.bounds.width}
              height={feature.bounds.height}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clipId}-${feature.key})`}
              onError={() => setFailedSources(previous => new Set(previous).add(photo.src))}
            />}
            <path className="preview-dept-border" d={feature.path} fillRule="evenodd" />
          </g>;
        })}
      </svg> : <span className="map-preview-pending">Preparando el mapa…</span>}
    </button>
  </div>;
}
