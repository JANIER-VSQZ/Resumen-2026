import React from 'react';
import { hasContent, isPublished } from '../../content';

export default function MapDepartment({ feature, idPrefix, department, visible, selectable = true, hovered, labels, zoom, failedSources, onPhotoError, onHover, onOpen, selected, projectMode, overviewMode }) {
  const content = hasContent(department);
  const thumbnail = department?.mapThumbnail;
  const showThumbnail = thumbnail && !failedSources.has(thumbnail);
  const canSelect = visible && selectable;
  const [cx, cy] = feature.center;
  const classes = ['department', content && visible && 'has-content', department?.demo && 'is-demo', !visible && 'filtered-out', hovered && 'hovered', projectMode && visible && 'is-project-location', selected && 'is-selected'].filter(Boolean).join(' ');
  const status = projectMode ? (visible ? 'Departamento del proyecto' : 'Fuera de la cobertura de este proyecto') : department?.demo ? 'Demostración' : isPublished(department) ? 'Registro publicado' : 'Sin información publicada';

  return (
    <g data-department={feature.name} className={classes} role="button" tabIndex={canSelect ? 0 : -1} aria-disabled={!canSelect || undefined} aria-pressed={(projectMode || overviewMode) && visible ? Boolean(selected) : undefined} aria-label={overviewMode ? (visible ? 'Ver proyectos en ' : 'Fuera de los filtros: ') + feature.name : projectMode ? (canSelect ? 'Ver actividades en ' : visible ? 'Cobertura del proyecto: ' : 'Fuera del proyecto: ') + feature.name : 'Abrir ' + feature.name}
      onMouseEnter={() => onHover(visible ? feature.name : null)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(feature.name)} onBlur={() => onHover(null)}
      onClick={event => { if (event.detail === 0 && canSelect) onOpen(feature.name); }}
      onKeyDown={event => { if (canSelect && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onOpen(feature.name); } }}>
      <title>{feature.name + ': ' + status}</title>
      <g id={idPrefix + 'visual-' + feature.key} className={'department-visual' + (visible && hovered ? ' is-highlighted' : '')}>
        <path className="dept-base" d={feature.path} fillRule="evenodd" />
        {visible && showThumbnail && <image href={thumbnail} x={feature.bounds.x} y={feature.bounds.y} width={feature.bounds.width} height={feature.bounds.height} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${idPrefix}dept-${feature.key})`} onError={() => onPhotoError(thumbnail)} />}
        <path className="dept-border" d={feature.path} fillRule="evenodd" />
        {labels && visible && (
          <text className={'map-name' + (content ? ' with-content' : '')} x={cx} y={cy} textAnchor="middle" fontSize={zoom >= 2 ? 12 / Math.sqrt(zoom / 2) : 13}>
            {feature.name.split(' ').length > 1 && feature.bounds.width < 120 ? feature.name.split(' ').map((word, index, words) => <tspan key={index} x={cx} dy={index ? '1.1em' : -(words.length - 1) * 5}>{word}</tspan>) : feature.name}
          </text>
        )}
      </g>
      {/* El área de selección permanece fija mientras la silueta se amplía. */}
      <path className="department-hit-area" d={feature.path} fillRule="evenodd" />
    </g>
  );
}
