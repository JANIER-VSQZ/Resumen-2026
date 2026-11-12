import React from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { hasContent, photoMatches } from '../content';
import useCardEntrance from '../hooks/useCardEntrance';
import ProjectFilters from '../components/projects/ProjectFilters';
import ProjectSection from '../components/projects/ProjectSection';

export default function DepartmentDetail({ name, detail, period, verified, filters, onFilterChange, onHome, onBack, onOpenPhoto }) {
  const cardEntranceRef = useCardEntrance(filters);
  const projects = hasContent(detail) ? detail.projects || [] : [];
  const hasFilters = Boolean(filters.community || filters.project || filters.axis);
  const clearFilters = () => onFilterChange({ community: '', project: '', axis: '' });
  const visibleProjects = projects.map((project, index) => ({ project, index, photos: project.photos.filter(photo => photoMatches(photo, filters)) }))
    .filter(({ project }) => (!filters.project || project.name === filters.project) && (!filters.axis || project.axis === filters.axis) && (!filters.community || project.communities.includes(filters.community)));
  const photoCount = visibleProjects.reduce((count, item) => count + item.photos.length, 0);

  return (
    <main className="detailview" id="main-content" tabIndex={-1} aria-labelledby="page-title">
      <div className="department-heading">
        <button className="department-brand" onClick={onHome} aria-label="Ir a portada">
          <img className="institutional-logo" src="/assets/asonog-logo.png" alt="Logotipo de ASONOG" />
        </button>
        <h1 className="page-title" id="page-title">{name}</h1>
        <div className="detail-header">
          <button className="back" onClick={onBack}><ArrowLeft size={16} /> Volver al mapa</button>
          <span>Honduras / {name} / {period}</span>
        </div>
      </div>
      
      {/*detail.summary && <p className="department-summary">{detail.summary}</p>*/}
      {/*detail.demo && <p className="demo-notice">Estos proyectos, actividades, logros y fotografías son ejemplos de demostración. No representan evidencia institucional.</p>*/}
      {/* <ProjectFilters projects={projects} filters={filters} onChange={onFilterChange} onClear={clearFilters} /> */}
      {/*<p className="project-results" role="status">{visibleProjects.length} {visibleProjects.length === 1 ? 'proyecto' : 'proyectos'} · {photoCount} fotografías{hasFilters ? ' con los filtros seleccionados' : ''}</p>*/}
      <div className="project-list" ref={cardEntranceRef}>
        {visibleProjects.length ? visibleProjects.map(({ project, index, photos }) => (
          <ProjectSection key={project.id} project={project} photos={photos} index={index} period={period} community={filters.community} onOpenPhoto={onOpenPhoto} />
        )) : (
          <div className="gallery-empty" role="status">
            <Camera size={30} /><strong>{hasFilters ? 'No hay proyectos con estos filtros' : 'Proyectos pendientes de incorporar'}</strong>
            <p>{hasFilters ? 'Prueba otra combinación para explorar este territorio.' : 'Pronto compartiremos las actividades, logros e imágenes de este territorio.'}</p>
            {hasFilters && <button className="back" onClick={clearFilters}>Mostrar todos los proyectos</button>}
          </div>
        )}
      </div>
    </main>
  );
}
