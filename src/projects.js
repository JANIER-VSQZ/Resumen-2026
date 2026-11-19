import { hasContent, normalizeProject, orderedPhotos } from './content.js';

// Cada proyecto del JSON produce una entrada del menú con sus propios territorios.
export function buildProjectCatalog(projects) {
  return (projects || []).filter(hasContent).map(source => {
    const project = normalizeProject(source);
    const entries = project.departments.map(department => ({
      id: department.id,
      department: department.names[0],
      departments: department.names,
      project: { ...department, name: project.name },
    }));
    return {
      ...project,
      entries,
      departments: [...new Set(project.departments.flatMap(department => department.names))].sort((a, b) => a.localeCompare(b, 'es')),
      photos: orderedPhotos(project.departments.flatMap(department => department.photos)),
      activityCount: project.departments.reduce((count, department) => count + department.activities.length, 0),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

// Los filtros se aplican a la misma intervención para conservar su cobertura real.
export function filterProjectCatalog(projects, filters) {
  return projects.filter(project => !filters.project || project.id === filters.project).map(project => {
    const entries = project.entries.filter(entry => !filters.axis || entry.project.axis === filters.axis);
    return {
      ...project,
      entries,
      departments: [...new Set(entries.flatMap(entry => entry.departments))].sort((a, b) => a.localeCompare(b, 'es')),
      photos: orderedPhotos(entries.flatMap(entry => entry.project.photos)),
      activityCount: entries.reduce((count, entry) => count + entry.project.activities.length, 0),
    };
  }).filter(project => project.entries.length);
}

// Los filtros eligen los proyectos; el detalle conserva su contenido completo.
export function getDepartmentProjects(projects, department, filters = {}) {
  const matchingIds = new Set(filterProjectCatalog(projects, filters)
    .filter(project => project.departments.includes(department)).map(project => project.id));
  return projects.filter(project => matchingIds.has(project.id));
}
