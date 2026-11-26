import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import TerritoryMap from '../components/map/TerritoryMap';
import ProjectSection from '../components/projects/ProjectSection';

export default function MapPage({ project, period, features, thumbnails = {}, department, departmentLocked = false, onDepartmentChange, onBack, onHome, onOpenPhoto, embedded = false, hideMap = false }) {
  const instanceId = useId().replace(/:/g, '');
  const titleId = embedded ? 'project-' + instanceId + '-title' : 'page-title';
  const Container = embedded ? 'article' : 'main';
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
  const activityCount = project.activityCount ?? project.entries.reduce((count, entry) => count + entry.project.activities.length, 0);
  const achievementCount = project.entries.reduce((count, entry) => count + entry.project.achievements.length, 0);
  const photoCount = project.photos.length;
  const heroPhoto = useMemo(() => {
    const photos = project.photos?.filter(photo => photo.src) || [];
    return photos.length ? photos[Math.floor(Math.random() * photos.length)] : null;
  }, [project.id, project.photos]);

  function selectDepartment(name) {
    if (departmentLocked) return;
    onDepartmentChange(name);
    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  console.log(selectedDepartment);

  console.log ("embedded: "+ embedded);
  console.log ("departement locked: "+departmentLocked);

  return (
    <Container className={embedded ? 'project-map-embedded' : 'mapview project-map-page'} id={embedded ? undefined : 'main-content'} tabIndex={embedded ? undefined : -1} aria-labelledby={titleId} data-selected-project={embedded ? undefined : project.id} data-project-detail={project.id}>
      {!embedded && <nav className="project-page-nav project-detail-nav" aria-label="Navegación del proyecto">
        <button className="back" onClick={onBack}>Volver al mapa</button>
      </nav>}

      {!embedded && !hideMap && (
        <section className="project-hero" aria-labelledby={titleId}>
          {heroPhoto && (
            <div className="hero-background" style={{ backgroundImage: `url("${heroPhoto.src}")` }} aria-hidden="true" />
          )}
          <div className="project-hero-content">
            <button className="project-hero-brand" onClick={onHome} aria-label="Ir a portada">
              <img className="institutional-logo" src="/assets/asonog-logo.png" alt="ASONOG" />
            </button>
            <div className="project-hero-copy">
              {project.axis && <p className="project-hero-eyebrow">{project.axis}</p>}
              <h1
                className="project-hero-title"
                aria-label={project.name}
                style={{ '--text-length': project.name.length }}
              >
                {project.name.trim().split(/\s+/).map((word, wordIndex) => (
                  <span className="hero-word" key={wordIndex} aria-hidden="true">
                    {Array.from(word).map((letter, letterIndex) => (
                      <span className="hero-letter" key={letterIndex}>
                        {letter}
                      </span>
                    ))}
                  </span>
                ))}
              </h1>
              {project.summary && <p className="project-hero-summary">{project.summary}</p>}
              <dl className="project-hero-stats" aria-label="Resumen del proyecto">
                <div><dt>Departamentos</dt><dd>{project.departments.length}</dd></div>
                <div><dt>Actividades</dt><dd>{activityCount}</dd></div>
                <div><dt>Logros</dt><dd>{achievementCount}</dd></div>
                <div><dt>Fotografías</dt><dd>{photoCount}</dd></div>
              </dl>
              {project.demo && <p className="project-hero-demo">Proyecto de demostración · No representa resultados institucionales</p>}
            </div>
          </div>
          <div className="project-hero-map">
            <TerritoryMap
              features={features}
              departments={departments}
              matches={matches}
              hovered={hovered}
              onHover={setHovered}
              onOpen={selectDepartment}
              selected={selectedDepartment}
              selectionLocked={departmentLocked}
              projectMode
            />
          </div>
        </section>
      )}

      {embedded && project.demo && <p className="demo-notice">Proyecto de demostración. Este contenido no representa resultados institucionales.</p>}

      <section className="project-evidence" ref={resultsRef} tabIndex={-1} aria-label={selectedDepartment ? 'Actividades y fotografías en ' + selectedDepartment : 'Actividades y fotografías del proyecto'}>
        <div className="project-evidence-heading">
          {selectedDepartment && !departmentLocked && <button className="back" onClick={() => selectDepartment(null)}>Mostrar todos los departamentos</button>}
        </div>
        <div className="project-list">
          {visibleEntries.map(({ id, project: record, departments: coverage }) => (
            <ProjectSection key={id} project={record} period={period} location={selectedDepartment ? selectedDepartment : coverage.join(" . ")} headingLevel={embedded ? 4 : 3} onOpenPhoto={onOpenPhoto} embed={embedded} />
          ))}
        </div>
      </section>
      {!embedded && <button className="back project-bottom-back" onClick={onBack}>Volver al mapa general</button>}
    </Container>
  );
}
