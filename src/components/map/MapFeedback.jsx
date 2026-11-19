import React from 'react';
import { MapPin } from 'lucide-react';
import { hasContent } from '../../content';

export default function MapFeedback({ hovered, departments, matches }) {
  if (!hovered) return null;
  const selected = departments[hovered];
  const matching = matches(hovered);
  const projects = hasContent(selected) && matching ? selected.projects || [] : [];
  return (
    <div className="map-tooltip" role="status">
      <MapPin size={14} /><strong>{hovered}</strong>
      {projects.length ? <>
        <small>{selected.demo ? 'Proyectos de demostración' : 'Proyectos realizados'}</small>
        <ul className="map-tooltip-projects" aria-label="Proyectos realizados">
          {projects.map(project => <li key={project.id}>{project.name}</li>)}
        </ul>
      </> : <small>{!matching ? 'Este departamento no coincide con los filtros actuales.' : 'Sin proyectos publicados para este departamento.'}</small>}
    </div>
  );
}
