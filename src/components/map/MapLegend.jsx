import React from 'react';

export default function MapLegend({ projectMode }) {
  return (
    <div className="map-legend">
      {projectMode ? <><span className="project-legend-location">Departamentos del proyecto</span><span className="project-legend-other">Otros departamentos</span></> : <small>Haz clic en un departamento para abrir sus proyectos</small>}
    </div>
  );
}
