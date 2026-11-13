import React from 'react';
import { hasContent, isPublished } from '../../content';

export default function MapDepartment({ feature, department, visible, hovered, labels, zoom, failedSources, onPhotoError, onHover, onOpen }) {
  const content = hasContent(department);
  const thumbnail = department?.mapThumbnail;
  const showThumbnail = thumbnail && !failedSources.has(thumbnail);
  const [cx, cy] = feature.center;
  const classes = ['department', content && visible && 'has-content', department?.demo && 'is-demo', !visible && 'filtered-out', hovered && 'hovered'].filter(Boolean).join(' ');

  return (
    <g data-department={feature.name} className={classes} role="button" tabIndex={visible ? 0 : -1} aria-disabled={!visible || undefined} aria-label={'Abrir ' + feature.name}
      onMouseEnter={() => onHover(feature.name)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(feature.name)} onBlur={() => onHover(null)}
      onClick={event => { if (event.detail === 0 && visible) onOpen(feature.name); }}
      onKeyDown={event => { if (visible && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onOpen(feature.name); } }}>
      <title>{feature.name}: {department?.demo ? 'Demostración' : isPublished(department) ? 'Registro publicado' : 'Sin información publicada'}</title>
      <g id={'map-visual-' + feature.key} className={'department-visual' + (visible && hovered ? ' is-highlighted' : '')}>
        <path className="dept-base" d={feature.path} fillRule="evenodd" />
        {visible && showThumbnail && <image href={thumbnail} x={feature.bounds.x} y={feature.bounds.y} width={feature.bounds.width} height={feature.bounds.height} preserveAspectRatio="xMidYMid slice" clipPath={`url(#dept-${feature.key})`} onError={() => onPhotoError(thumbnail)} />}
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
