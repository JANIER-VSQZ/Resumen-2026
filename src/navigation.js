import { DEPARTMENTS } from './content.js';

export function getAdjacentScreen(current, direction) {
  if (current.view === 'cover') return { view: 'projects' };
  if (current.view === 'projects') return { view: 'cover' };
  if (['map', 'department-projects'].includes(current.view) && direction < 0) return { view: 'projects' };
  // Los detalles se abren desde los proyectos disponibles en el mapa general.
  return null;
}

export function getScreenHref(screen) {
  if (screen.view === 'cover') return '#/';
  if (screen.view === 'map' && screen.selected) return '#/proyectos/' + encodeURIComponent(screen.selected) + '/mapa' + (screen.department ? '?departamento=' + encodeURIComponent(screen.department) : '');
  if (screen.view === 'department-projects' && screen.department) return '#/departamentos/' + encodeURIComponent(screen.department) + '/proyectos';
  return '#/mapa';
}

export function getDepartmentDestination(projects, department) {
  if (!DEPARTMENTS.includes(department)) return { view: 'projects' };
  const matches = projects.filter(project => project.departments?.includes(department));
  return { view: 'department-projects', department };
}

export function getScreenFromHash(hash, projects) {
  if (!hash || hash === '#' || hash === '#/') return { view: 'cover' };
  const [route, query = ''] = hash.split('?');
  const match = route.match(/^#\/proyectos\/([^/]+)\/mapa$/);
  if (match) {
    try {
      const selected = decodeURIComponent(match[1]);
      const project = projects.find(project => project.id === selected);
      if (project) {
        const department = new URLSearchParams(query).get('departamento');
        return { view: 'map', selected, ...(project.departments?.includes(department) ? { department } : {}) };
      }
    } catch { /* Un enlace incompleto vuelve al menú. */ }
  }
  const departmentMatch = route.match(/^#\/departamentos\/([^/]+)\/proyectos$/);
  if (departmentMatch) {
    try {
      const department = decodeURIComponent(departmentMatch[1]);
      if (DEPARTMENTS.includes(department)) return { view: 'department-projects', department };
    } catch { /* Un departamento no válido vuelve al mapa general. */ }
  }
  return { view: 'projects' };
}

export function shouldIgnoreShortcut(event) {
  const target = event.target;
  return event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey ||
    event.altKey || event.shiftKey || target?.isContentEditable || Boolean(target?.closest?.(
      'input, textarea, select, [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"]',
    ));
}
