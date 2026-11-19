import React from 'react';
import { FolderOpen } from 'lucide-react';
import MapPage from './MapPage';

export default function DepartmentProjectsPage({ department, projects, hasFilters, period, features, thumbnails, onOpenPhoto, onClearFilters, onBack, onHome }) {
  const entries = projects.flatMap(project => project.entries.filter(entry => entry.departments.includes(department)));
  const activities = entries.reduce((count, entry) => count + entry.project.activities.length, 0);
  const photos = entries.reduce((count, entry) => count + entry.project.photos.length, 0);

  return (
    <main className="projectsview department-projects-page" id="main-content" tabIndex={-1} aria-labelledby="page-title" data-department-projects={department}>
      <nav className="project-page-nav" aria-label="Navegación del departamento">
        <button className="project-page-brand" onClick={onHome} aria-label="Ir a portada"><img className="institutional-logo" src="/assets/asonog-logo.png" alt="ASONOG" /></button>
        <h1 className="page-title project-nav-title" id="page-title">{department}</h1>
        <button className="back" onClick={onBack}>Volver al mapa</button>
      </nav>
      <header className="projects-intro">
        {projects.length > 0 && <p  className="department-project-totals" role="status">Contenido en este territorio: {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'} · {activities} {activities === 1 ? 'actividad' : 'actividades'} · {photos} fotografías</p>}
      </header>
      {projects.length ? <div className="department-project-details">
        {projects.map(project => <MapPage key={department + ':' + project.id} embedded departmentLocked department={department} project={project} period={period} features={features} thumbnails={thumbnails} onOpenPhoto={onOpenPhoto} />)}
      </div> : <div className="gallery-empty" role="status">
        <FolderOpen size={32} aria-hidden="true" />
        <strong>{hasFilters ? 'No hay proyectos con estos filtros' : 'Todavía no hay proyectos publicados en ' + department}</strong>
        <p>{hasFilters ? 'Muestra todos los proyectos del departamento o vuelve al mapa para cambiar la selección.' : 'Vuelve al mapa para explorar los departamentos con proyectos.'}</p>
        {hasFilters && <button className="back" onClick={onClearFilters}>Mostrar todos los proyectos del departamento</button>}
      </div>}
      {projects.length > 0 && <button className="back project-bottom-back" onClick={onBack}>Volver al mapa general</button>}
    </main>
  );
}
