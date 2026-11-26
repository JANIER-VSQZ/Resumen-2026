import React, { useEffect, useId, useMemo, useState } from 'react';
import { ChevronDown, FolderOpen, SlidersHorizontal } from 'lucide-react';
import MapPage from './MapPage';
import TerritoryMap from '../components/map/TerritoryMap';

export default function DepartmentProjectsPage({ department, projects, hasFilters, period, features, thumbnails, onOpenPhoto, onClearFilters, onBack, onHome }) {
  const [selectedProject, setSelectedProject] = useState('');
  const [hovered, setHovered] = useState(null);
  const selectId = useId();

  const departmentProjects = useMemo(() => projects.filter(project =>
    project.entries.some(entry => entry.departments.includes(department))
  ), [projects, department]);
  const visibleProjects = selectedProject
    ? departmentProjects.filter(project => project.id === selectedProject)
    : departmentProjects;
  const entries = visibleProjects.flatMap(project =>
    project.entries.filter(entry => entry.departments.includes(department))
  );
  const heroPhoto = useMemo(() => {
    const photos = departmentProjects
      .flatMap(project => project.entries
        .filter(entry => entry.departments.includes(department))
        .flatMap(entry => entry.project.photos || []))
      .filter(photo => photo.src);
    return photos.length ? photos[Math.floor(Math.random() * photos.length)] : null;
  }, [department, departmentProjects]);
  const visibleDepartments = [department];
  const matches = name => visibleDepartments.includes(name);
  const mapDepartments = Object.fromEntries(visibleDepartments.map(name => {
    const projectsInDepartment = visibleProjects.filter(project => project.departments.includes(name));
    return [name, {
      verified: projectsInDepartment.every(project => project.verified),
      demo: projectsInDepartment.some(project => project.demo),
      mapThumbnail: thumbnails?.[name] || '',
      projects: projectsInDepartment,
    }];
  }));
  const activities = entries.reduce((count, entry) => count + entry.project.activities.length, 0);
  const photos = entries.reduce((count, entry) => count + entry.project.photos.length, 0);

  useEffect(() => {
    if (selectedProject && !departmentProjects.some(project => project.id === selectedProject)) {
      setSelectedProject('');
    }
  }, [departmentProjects, selectedProject]);

  return (
    <main
      className="projectsview department-projects-page"
      id="main-content"
      tabIndex={-1}
      aria-labelledby="page-title"
      data-department-projects={department}
    >
      <nav className="department-project-nav" aria-label="Navegación del departamento">
        <button className="back" onClick={onBack}>Volver al mapa</button>
      </nav>

      {departmentProjects.length > 0 && (
        <section className="department-hero" aria-labelledby="page-title">
          {heroPhoto && (
            <div className="hero-background" style={{ backgroundImage: `url("${heroPhoto.src}")` }} aria-hidden="true" />
          )}
          <div className="department-hero-content">
            <button className="department-hero-brand" onClick={onHome} aria-label="Ir a portada">
              <img className="institutional-logo" src="/assets/asonog-logo.png" alt="ASONOG" />
            </button>
            <div className="department-hero-copy">
              <p className="department-hero-eyebrow">Trabajo territorial</p>
              <h1
                className="project-hero-title"
                aria-label={department}
                style={{ '--text-length': department.length }}
              >
                {department.trim().split(/\s+/).map((word, wordIndex) => (
                  <span className="hero-word" key={wordIndex} aria-hidden="true">
                    {Array.from(word).map((letter, letterIndex) => (
                      <span className="hero-letter" key={letterIndex}>
                        {letter}
                      </span>
                    ))}
                  </span>
                ))}
              </h1>
              <dl className="department-hero-stats">
                <div><dt>{visibleProjects.length === 1 ? 'proyecto' : 'proyectos'}</dt> <dd>{visibleProjects.length}</dd></div>
                <div><dt>{activities === 1 ? 'actividad' : 'actividades'}</dt> <dd>{activities}</dd> </div>
                <div><dt>{photos === 1 ? 'fotografía' : 'fotografías'}</dt> <dd>{photos}</dd></div>
              </dl>
            </div>
          </div>
          <div className="department-hero-map" aria-hidden="true">
            <TerritoryMap
              features={features}
              departments={mapDepartments}
              matches={matches}
              hovered={hovered}
              onHover={setHovered}
              selected={department}
              selectionLocked
              projectMode
            />
          </div>
        </section>
      )}

      {departmentProjects.length > 0 && (
        <header className="projects-intro department-projects-intro">
          <div className="department-project-filters">
            <label htmlFor={selectId}>
              <SlidersHorizontal size={17} aria-hidden="true" />
              Filtrar proyectos
            </label>
            <div className="department-project-select">
              <select id={selectId} value={selectedProject} onChange={event => setSelectedProject(event.target.value)}>
                <option value="">Todos los proyectos</option>
                {departmentProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <ChevronDown size={17} aria-hidden="true" />
            </div>
          </div>
        </header>
      )}

      {departmentProjects.length > 0 ? (
        <div className="department-project-content">
          <div className="department-project-details" aria-live="polite">
            {visibleProjects.map(project => (
              <MapPage
                key={department + ':' + project.id}
                embedded
                departmentLocked
                hideMap
                department={department}
                project={project}
                period={period}
                features={features}
                thumbnails={thumbnails}
                onOpenPhoto={onOpenPhoto}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="gallery-empty" role="status">
          <FolderOpen size={32} aria-hidden="true" />
          <strong>
            {hasFilters
              ? 'No hay proyectos con estos filtros'
              : 'Todavía no hay proyectos publicados en ' + department}
          </strong>
          <p>
            {hasFilters
              ? 'Muestra todos los proyectos del departamento o vuelve al mapa para cambiar la selección.'
              : 'Vuelve al mapa para explorar los departamentos con proyectos.'}
          </p>
          {hasFilters && (
            <button className="back" onClick={onClearFilters}>
              Mostrar todos los proyectos del departamento
            </button>
          )}
        </div>
      )}

      {departmentProjects.length > 0 && (
        <button className="back project-bottom-back" onClick={onBack}>
          Volver al mapa general
        </button>
      )}
    </main>
  );
}
