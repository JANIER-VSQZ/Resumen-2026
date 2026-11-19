import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import TerritoryMap from '../components/map/TerritoryMap';
import ProjectSection from '../components/projects/ProjectSection';

export default function MapPage({ project, period, features, thumbnails = {}, department, departmentLocked = false, onDepartmentChange, onBack, onHome, onOpenPhoto, embedded = false }) {
  const instanceId = useId().replace(/:/g, '');
  const titleId = embedded ? 'project-' + instanceId + '-title' : 'page-title';
  const coverageId = embedded ? 'project-' + instanceId + '-coverage' : 'coverage-title';
  const Container = embedded ? 'article' : 'main';
  const SectionTitle = embedded ? 'h3' : 'h2';
  const [hovered, setHovered] = useState(null);
  const selectedDepartment = department || null;
  const resultsRef = useRef(null);
  const matches = useCallback(name => project.departments.includes(name), [project]);
  const departments = useMemo(() => Object.fromEntries(project.departments.map(name => [name, {
    verified: !project.demo,
    demo: project.demo,
    mapThumbnail: thumbnails[name] || '',
    projects: project.entries.filter(entry => entry.departments.includes(name)).map(entry => entry.project),
  }])), [project, thumbnails]);
  const visibleEntries = selectedDepartment ? project.entries.filter(entry => entry.departments.includes(selectedDepartment)) : project.entries;

  function selectDepartment(name) {
    if (departmentLocked) return;
    onDepartmentChange(name);
    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  return (
    <Container className={embedded ? 'project-map-embedded' : 'mapview project-map-page'} id={embedded ? undefined : 'main-content'} tabIndex={embedded ? undefined : -1} aria-labelledby={titleId} data-selected-project={embedded ? undefined : project.id} data-project-detail={project.id}>
      {!embedded && <nav className="project-page-nav" aria-label="Navegación del proyecto">
        <button className="project-page-brand" onClick={onHome} aria-label="Ir a portada"><img className="institutional-logo" src="/assets/asonog-logo.png" alt="ASONOG" /></button>
        <h1 className="page-title project-nav-title" id={titleId}>{project.name}</h1>
        <button className="back" onClick={onBack}>Volver al mapa</button>
      </nav>}
      {embedded && <header className="project-map-heading">
        <h2 className="page-title" id={titleId}>{project.name}</h2>
      </header>}
      {project.demo && <p className="demo-notice">Proyecto de demostración. Este contenido no representa resultados institucionales.</p>}
      <section className="project-map-overview" aria-labelledby={coverageId}>
        <aside className="project-coverage">
          <SectionTitle className="project-coverage-title" id={coverageId}><MapPin size={22} aria-hidden="true" />Dónde trabajamos</SectionTitle>
          <p>{project.departments.length} {project.departments.length === 1 ? 'departamento' : 'departamentos'} de Honduras</p>
          <p>Los departamentos en verde forman parte del proyecto. {departmentLocked ? 'Estás consultando ' + selectedDepartment + '.' : 'Selecciona uno para ver sus actividades e imágenes.'}</p>
          <div className="project-territories" aria-label="Departamentos del proyecto">
            {project.departments.map(name => <button key={name} disabled={departmentLocked && selectedDepartment !== name} aria-pressed={selectedDepartment === name} onClick={() => selectDepartment(name)}>{name}</button>)}
          </div>
          <dl className="project-totals">
            <div><dt>Actividades</dt><dd>{project.activityCount}</dd></div>
            <div><dt>Fotografías</dt><dd>{project.photos.length}</dd></div>
          </dl>
        </aside>
        <TerritoryMap features={features} departments={departments} matches={matches} hovered={hovered} onHover={setHovered} onOpen={selectDepartment} selected={selectedDepartment} selectionLocked={departmentLocked} projectMode />
      </section>
      <section className="project-evidence" ref={resultsRef} tabIndex={-1} aria-label={selectedDepartment ? 'Actividades y fotografías en ' + selectedDepartment : 'Actividades y fotografías del proyecto'}>
        <div className="project-evidence-heading">
          {selectedDepartment && !departmentLocked && <button className="back" onClick={() => selectDepartment(null)}>Mostrar todos los departamentos</button>}
        </div>
        <div className="project-list">
          {visibleEntries.map(({ id, project: record, departments: coverage }) => (
            <ProjectSection key={id} project={record} period={period} location={coverage.join(' · ')} headingLevel={embedded ? 4 : 3} onOpenPhoto={onOpenPhoto} />
          ))}
        </div>
      </section>
      {!embedded && <button className="back project-bottom-back" onClick={onBack}>Volver al mapa general</button>}
    </Container>
  );
}
