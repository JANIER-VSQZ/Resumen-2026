export const DEPARTMENTS = ['Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés', 'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara', 'Valle', 'Yoro'];
export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
export const isPublished = department => department?.verified === true && department.demo !== true;
export const hasContent = department => isPublished(department) || department?.demo === true;
export const photoMatches = (photo, filters) => ['community', 'project', 'axis'].every(key => !filters[key] || photo[key] === filters[key]);
export const orderedPhotos = photos => [...(photos || [])].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
export const photoPosition = photo => `${photo.focalX ?? 50}% ${photo.focalY ?? 50}%`;
export function formatDate(value) {
  if (!value) return 'Fecha pendiente';
  const date = new Date(value + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function calculateMetrics(departments) {
  const published = Object.values(departments || {}).filter(isPublished);
  return {
    departments: published.length,
    communities: published.reduce((total, department) => total + new Set((department.projects || []).flatMap(project => project.communities || [])).size, 0),
    activities: published.reduce((total, department) => total + (department.projects || []).reduce((count, project) => count + (project.activities || []).length, 0), 0),
    beneficiaries: !published.length || published.some(department => department.beneficiaries == null)
      ? null : published.reduce((total, department) => total + Number(department.beneficiaries), 0),
  };
}

export function normalizeContent(input) {
  const data = structuredClone(input);
  for (const department of Object.values(data.departments || {})) {
    department.projects = (department.projects || []).map(project => ({
      ...project,
      photos: orderedPhotos(project.photos).map(photo => ({ ...photo, project: project.name, projectId: project.id, axis: project.axis || '' })),
    }));

    department.photos = department.projects.flatMap(project => project.photos);
  }
  data.metrics = calculateMetrics(data.departments);
  return data;
}

export function validateContent(input) {
  if (!input || typeof input !== 'object' || !input.departments || typeof input.departments !== 'object' || Array.isArray(input.departments)) throw Error('El archivo debe contener una lista de departamentos.');
  for (const field of ['institution', 'period', 'subtitle', 'sourceNote']) if (input[field] != null && typeof input[field] !== 'string') throw Error(`El campo ${field} debe ser un texto.`);
  for (const [name, department] of Object.entries(input.departments)) {
    if (!DEPARTMENTS.includes(name) || !department || typeof department !== 'object' || Array.isArray(department)) throw Error(`Departamento no válido: ${name}.`);
    if (department.summary != null && typeof department.summary !== 'string') throw Error(`Revisa el resumen en ${name}.`);
    for (const field of ['communities', 'activities', 'results', 'photos']) if (field in department) throw Error(`Mueve ${field} a su proyecto en ${name}.`);
    if (!Array.isArray(department.projects)) throw Error(`Revisa la lista de proyectos en ${name}.`);
    for (const field of ['verified', 'demo']) if (department[field] != null && typeof department[field] !== 'boolean') throw Error(`Revisa el estado de ${name}.`);
    if (department.beneficiaries != null && (!Number.isSafeInteger(department.beneficiaries) || department.beneficiaries < 0)) throw Error(`La cantidad de personas en ${name} debe ser un número entero positivo o quedar vacía.`);
    const ids = new Set(), names = new Set();
    for (const project of department.projects) {
      if (!project || typeof project !== 'object' || Array.isArray(project)) throw Error(`Cada proyecto de ${name} debe ser un objeto con sus actividades, comunidades, logros y fotografías.`);
      for (const field of ['id', 'name']) if (typeof project[field] !== 'string' || !project[field].trim()) throw Error(`Falta ${field} en un proyecto de ${name}.`);
      if (ids.has(project.id) || names.has(normalize(project.name))) throw Error(`Hay proyectos repetidos en ${name}. Usa identificadores y nombres distintos.`);
      ids.add(project.id); names.add(normalize(project.name));
      const context = `${project.name} (${name})`;
      for (const field of ['summary', 'axis']) if (project[field] != null && typeof project[field] !== 'string') throw Error(`Revisa ${field} en ${context}.`);
      for (const [field, count, label] of [['activities', 4, 'actividades destacadas'], ['achievements', 2, 'logros'], ['communities', null, 'comunidades de intervención']]) {
        if (!Array.isArray(project[field]) || !project[field].length || (count && project[field].length !== count) || project[field].some(value => typeof value !== 'string' || !value.trim())) throw Error(`${context} debe tener ${count || 'una o más'} ${label} con texto.`);
      }
      if (!Array.isArray(project.photos) || project.photos.length !== 6) throw Error(`${context} debe tener exactamente 6 fotografías.`);
      for (const photo of project.photos) {
        if (!photo || typeof photo.src !== 'string' || !/^(\/assets\/|https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i.test(photo.src)) throw Error(`Hay una fotografía con una dirección no válida en ${context}.`);
        for (const field of ['id', 'community', 'date', 'description', 'thumbnail']) if (photo[field] != null && typeof photo[field] !== 'string') throw Error(`Revisa los datos de una fotografía de ${context}.`);
        if (photo.community && !project.communities.includes(photo.community)) throw Error(`La comunidad de una fotografía no pertenece a ${context}.`);
        if ('project' in photo || 'axis' in photo) throw Error(`El nombre del proyecto y su eje se definen una sola vez en ${context}, fuera de las fotografías.`);
        if (photo.featured != null && typeof photo.featured !== 'boolean') throw Error(`Revisa la fotografía destacada en ${context}.`);
        if (photo.thumbnail && !/^(\/assets\/|https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i.test(photo.thumbnail)) throw Error(`Miniatura no válida en ${context}.`);
        for (const field of ['focalX', 'focalY']) if (photo[field] != null && (!Number.isFinite(photo[field]) || photo[field] < 0 || photo[field] > 100)) throw Error(`Revisa el encuadre en ${context}.`);
        for (const field of ['width', 'height', 'thumbnailWidth']) if (photo[field] != null && (!Number.isSafeInteger(photo[field]) || photo[field] <= 0)) throw Error(`Revisa las dimensiones de una fotografía de ${context}.`);
      }
    }
  }
  return normalizeContent(input);
}
