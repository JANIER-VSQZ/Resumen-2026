import React from 'react';
import { MapPin, X } from 'lucide-react';
import { hasContent } from '../../content';

export default function MapFeedback({ hovered, preview, departments, filters, matches, onClosePreview }) {
  const selected = departments[hovered];
  const matching = hovered && matches(hovered);
  const projects = hasContent(selected) && matching ? (selected.projects || []).filter(project =>
    (!filters.project || project.name === filters.project) && (!filters.axis || project.axis === filters.axis),
  ) : [];
  return (
    <>
      {hovered && !preview && (
        <div className="map-tooltip" role="status">
          <MapPin size={14} /><strong>{hovered}</strong>
          {projects.length ? <>
            <small>{selected.demo ? 'Proyectos de demostración' : 'Proyectos realizados'}</small>
            <ul className="map-tooltip-projects" aria-label="Proyectos realizados">
              {projects.map(project => <li key={project.id}>{project.name}</li>)}
            </ul>
          </> : <small>{!matching ? 'Este departamento no coincide con los filtros actuales.' : 'Sin proyectos publicados para este departamento.'}</small>}
        </div>
      )}
      {preview && (
        <div className="map-preview-card" role="status">
          <button aria-label="Cerrar ficha del mapa" onClick={onClosePreview}><X size={16} /></button>
          <strong><MapPin size={16} /> {preview}</strong>
          <p>Todavía no hay información publicada para este departamento.</p>
          <span>Explora los territorios resaltados para ver fotografías y proyectos.</span>
        </div>
      )}
    </>
  );
}
