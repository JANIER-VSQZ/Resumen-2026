export const DEPARTMENTS = ['Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés', 'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara', 'Valle', 'Yoro'];
export const MAP_THUMBNAIL_CONTEXTS = ['cover', 'interactive', 'detail'];
export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
export const isPublished = record => record?.verified === true && record.demo !== true;
export const hasContent = record => isPublished(record) || record?.demo === true;
export const orderedPhotos = photos => [...(photos || [])].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
export const photoPosition = photo => `${photo.focalX ?? 50}% ${photo.focalY ?? 50}%`;
export function formatDate(value) {
  if (!value) return 'Fecha pendiente';
  const date = new Date(value + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-HN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function normalizeProject(project) {
  return {
    ...project,
    verified: project.verified ?? false,
    demo: project.demo ?? false,
    beneficiaries: project.beneficiaries ?? null,
    departments: (project.departments || []).map((department, index) => ({
      ...department,
      id: department.id || project.id + '-territory-' + (index + 1),
      names: [...new Set(department.names || [])],
      axis: department.axis ?? project.axis ?? '',
      summary: department.summary ?? project.summary ?? '',
      communities: [...(department.communities || [])],
      activities: [...(department.activities || [])],
      achievements: [...(department.achievements || [])],
      photos: orderedPhotos(department.photos).map(photo => ({
        ...photo,
        project: project.name,
        projectId: project.id,
        axis: department.axis ?? project.axis ?? '',
        department: department.names?.[0] || '',
        departments: [...(department.names || [])],
      })),
    })),
  };
}

export function normalizeContent(input) {
  const data = structuredClone(input);
  data.mapThumbnails = Object.fromEntries(MAP_THUMBNAIL_CONTEXTS.map(context => [context, { ...(data.mapThumbnails?.[context] || {}) }]));
  data.projects = (data.projects || []).map(normalizeProject);
  // La portada recibe una vista derivada. El JSON se mantiene organizado por proyecto.
  data.departments = Object.fromEntries(DEPARTMENTS.map(name => [name, {
    coverMapThumbnail: data.mapThumbnails.cover[name] || '',
    verified: false, demo: false,
  }]));
  for (const project of data.projects.filter(hasContent)) {
    for (const department of project.departments) {
      for (const name of department.names) {
        const target = data.departments[name];
        target.verified ||= isPublished(project);
        target.demo = !target.verified && (target.demo || project.demo);
      }
    }
  }
  return data;
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isImageSource = value => typeof value === 'string' && /^(\/(?![\/\\])|https?:\/\/|data:image\/(jpeg|png|webp);base64,)/i.test(value);

export function validateContent(input) {
  if (!isObject(input) || !Array.isArray(input.projects)) throw Error('El archivo debe contener una lista projects. Carga los departamentos dentro de cada proyecto.');
  if ('departments' in input) throw Error('Mueve los departamentos a projects[].departments y las miniaturas a mapThumbnails.');
  for (const field of ['institution', 'period', 'subtitle', 'sourceNote', '$schema']) {
    if (input[field] != null && typeof input[field] !== 'string') throw Error('El campo ' + field + ' debe ser un texto.');
  }
  if (input.mapThumbnails !== undefined) {
    if (!isObject(input.mapThumbnails)) throw Error('mapThumbnails debe contener los grupos cover, interactive y detail.');
    for (const [context, thumbnails] of Object.entries(input.mapThumbnails)) {
      if (!MAP_THUMBNAIL_CONTEXTS.includes(context)) throw Error('Grupo de miniaturas no válido: ' + context + '. Usa cover, interactive o detail.');
      if (!isObject(thumbnails)) throw Error('mapThumbnails.' + context + ' debe ser un objeto con una imagen por departamento.');
      for (const [name, source] of Object.entries(thumbnails)) {
        if (!DEPARTMENTS.includes(name)) throw Error('Departamento no válido en mapThumbnails.' + context + ': ' + name + '.');
        if (source !== '' && !isImageSource(source)) throw Error('Miniatura del mapa no válida en ' + context + '.' + name + '.');
      }
    }
  }
  const ids = new Set();
  return normalizeContent(input);
}
