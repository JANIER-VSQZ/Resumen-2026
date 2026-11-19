import React from 'react';

export default function MapLegend({ projectMode, overviewMode }) {
  return (
    <div className="map-legend">
      {projectMode ? <><span className="project-legend-location">Departamentos del proyecto</span><span className="project-legend-other">Otros departamentos</span></> : <small>{overviewMode ? 'Haz clic en un departamento para abrir sus proyectos' : 'Haz clic en uno de los departamentos para ver más información'}</small>}
    </div>
  );
}
