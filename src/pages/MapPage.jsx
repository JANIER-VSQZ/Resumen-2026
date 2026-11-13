import React from 'react';
import TerritoryMap from '../components/map/TerritoryMap';
import MapFilters from '../components/map/MapFilters';
import DepartmentExplorer from '../components/map/DepartmentExplorer';
import MapMetrics from '../components/map/MapMetrics';

export default function MapPage({ content, features, explorer, onHome, onOpenDepartment }) {
  return (
    <main className="mapview" id="main-content" tabIndex={-1} aria-labelledby="page-title">
      <div className="map-heading">
        <h1 className="page-title page-title--map" id="page-title">
          <span className="map-title-context">Resumen de los </span>
          Proyectos <span>realizados </span>
          <span><small className="map-title-prefix">en el </small><em>{content.period}.</em></span>
        </h1>
      </div>
      {/*<MapFilters explorer={explorer} />*/}
      <div className="mapcontent">
        <TerritoryMap
          features={features}
          departments={content.departments}
          filters={explorer.filters}
          matches={explorer.matches}
          hovered={explorer.hovered}
          onHover={explorer.setHovered}
          onOpen={onOpenDepartment}
          preview={explorer.preview}
          onClosePreview={() => explorer.setPreview(null)}
        />
        {/*<DepartmentExplorer departments={content.departments} explorer={explorer} onOpen={onOpenDepartment} />*/}
      </div>
      <button className="map-brand" onClick={onHome} aria-label="Ir a portada">
        <img className="institutional-logo" src="/assets/asonog-logo.png" alt="Logotipo de ASONOG" />
      </button>
      {/*{explorer.demoCount > 0 && <p className="demo-notice">Los registros de demostración permiten recorrer la aplicación y se excluyen de las cifras publicadas.</p>}
      <MapMetrics metrics={content.metrics} />
      <div className="source-note">Cartografía incluida para uso sin conexión. Las cifras se calculan a partir de los departamentos publicados. Las personas se suman por registro y pueden aparecer en más de uno. {content.sourceNote}</div>*/}
    </main>
  );
}
