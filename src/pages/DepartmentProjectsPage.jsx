
import React, { useEffect, useId, useState } from 'react';
import {
  FolderOpen,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

import MapPage from './MapPage';
import TerritoryMap from '../components/map/TerritoryMap';




export default function DepartmentProjectsPage({
  department,
  projects,
  hasFilters,
  period,
  features,
  thumbnails,
  onOpenPhoto,
  onClearFilters,
  onBack,
  onHome
}) {
  const [selectedProject, setSelectedProject] = useState('');
  const selectId = useId();

  // Proyectos que tienen contenido en el departamento seleccionado.
  const departmentProjects = projects.filter(project =>
    project.entries.some(entry =>
      entry.departments.includes(department)
    )
  );

  console.log("Departamentos: " + departmentProjects);

  

  // Proyectos visibles según el filtro seleccionado.
  const visibleProjects = selectedProject
    ? departmentProjects.filter(
      project => project.id === selectedProject
    )
    : departmentProjects;

  // Entradas correspondientes al departamento.
  const entries = visibleProjects.flatMap(project =>
    project.entries.filter(entry =>
      entry.departments.includes(department)
    )
  );

  const visibleDepartments = [
  ...new Set(
    visibleProjects.flatMap(project => project.departments)
  )
];

// Determina qué departamentos deben colorearse en el mapa.
const matches = projectName =>
  visibleDepartments.includes(projectName);

// Información que recibirá el mapa.
const mapDepartments = Object.fromEntries(
  visibleDepartments.map(name => {
    const projectsInDepartment = visibleProjects.filter(project =>
      project.departments.includes(name)
    );

    return [
      name,
      {
        verified: projectsInDepartment.every(project => project.verified),
        demo: projectsInDepartment.some(project => project.demo),
        mapThumbnail: thumbnails?.[name] || '',
        projects: projectsInDepartment.map(project => project)
      }
    ];
  })
);

  console.log("hola"+ entries)

console.log(visibleDepartments);
  

  // Totales del contenido visible.
  const activities = entries.reduce(
    (count, entry) => count + entry.project.activities.length,
    0
  );

  const photos = entries.reduce(
    (count, entry) => count + entry.project.photos.length,
    0
  );

  // Restablecer selección si el proyecto desaparece
  // debido a un cambio en los filtros externos.
  useEffect(() => {
    if (
      selectedProject &&
      !departmentProjects.some(
        project => project.id === selectedProject
      )
    ) {
      setSelectedProject('');
    }
  }, [departmentProjects, selectedProject]);

  const [hovered, setHovered] = useState(null);

  console.log (mapDepartments)

  return (
    <main
      className="projectsview department-projects-page"
      id="main-content"
      tabIndex={-1}
      aria-labelledby="page-title"
      data-department-projects={department}
    >
      <nav
        className="project-page-nav"
        aria-label="Navegación del departamento"
      >
        <button
          className="project-page-brand"
          onClick={onHome}
          aria-label="Ir a portada"
        >
          <img
            className="institutional-logo Department-Project-Logo"
            src="/assets/asonog-logo.png"
            alt="ASONOG"
          />
        </button>

        <h1
          className="page-title project-nav-title"
          id="page-title"
        >
          {department}
        </h1>

        <button className="back" onClick={onBack}>
          Volver al mapa
        </button>
      </nav>



      <header className="projects-intro">

        {departmentProjects.length > 0 && (
          <p
            className="department-project-totals"
            role="status"
          >
            Contenido en este territorio: {' '}
            {visibleProjects.length}{' '}
            {visibleProjects.length === 1
              ? 'proyecto'
              : 'proyectos'}
            {' · '}
            {activities}{' '}
            {activities === 1
              ? 'actividad'
              : 'actividades'}
            {' · '}
            {photos} fotografías
          </p>

          
        )}

        {/* Filtro de proyectos */}
          <div className="department-project-filters">

            <label htmlFor={selectId}>
              <SlidersHorizontal
                size={17}
                aria-hidden="true"
              />
              Filtrar proyectos
            </label>

            <div className="department-project-select">

              <select
                id={selectId}
                value={selectedProject}
                onChange={event =>
                  setSelectedProject(event.target.value)
                }
              >
                <option value="">
                  Todos los proyectos
                </option>

                {departmentProjects.map(project => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                ))}

              </select>

              <ChevronDown
                size={17}
                aria-hidden="true"
              />

            </div>

          </div>

      </header>


      {departmentProjects.length > 0 ? (

        <div className="department-project-content">

          

          <section
            className="project-map-overview department-territory-map"
            aria-label="Mapa territorial del departamento"
          >
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
          </section>

          {/* Contenido de los proyectos */}
          <div
            className="department-project-details"
            aria-live="polite"
          >

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

        <div
          className="gallery-empty"
          role="status"
        >
          <FolderOpen
            size={32}
            aria-hidden="true"
          />

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
            <button
              className="back"
              onClick={onClearFilters}
            >
              Mostrar todos los proyectos del departamento
            </button>
          )}

        </div>

      )}

      {departmentProjects.length > 0 && (
        <button
          className="back project-bottom-back"
          onClick={onBack}
        >
          Volver al mapa general
        </button>
      )}

    </main>
  );
}
