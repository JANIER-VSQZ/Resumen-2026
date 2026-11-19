export const DEPARTMENTS = ['Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés', 'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara', 'Valle', 'Yoro'];
export const MAP_THUMBNAIL_CONTEXTS = ['cover', 'interactive', 'detail'];
export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
export const isPublished = record => record?.verified === true && record.demo !== true;
export const hasContent = record => isPublished(record) || record?.demo === true;
export const photoMatches = (photo, filters) => ['community', 'project', 'axis'].every(key => !filters[key] || photo[key] === filters[key]);
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

export function calculateMetrics(projects) {
  const published = (projects || []).filter(isPublished);
  const territories = published.flatMap(project => project.departments || []);
  return {
    departments: new Set(territories.flatMap(department => department.names)).size,
    communities: new Set(territories.flatMap(department => (department.communities || []).map(community =>
      JSON.stringify([[...department.names].sort(), community]),
    ))).size,
    activities: territories.reduce((count, department) => count + (department.activities || []).length, 0),
    beneficiaries: !published.length || published.some(project => project.beneficiaries == null)
      ? null : published.reduce((total, project) => total + project.beneficiaries, 0),
  };
}

export function normalizeContent(input) {
  const data = structuredClone(input);
  data.mapThumbnails = Object.fromEntries(MAP_THUMBNAIL_CONTEXTS.map(context => [context, { ...(data.mapThumbnails?.[context] || {}) }]));
  data.projects = (data.projects || []).map(normalizeProject);
  // La portada recibe una vista derivada. El JSON se mantiene organizado por proyecto.
  data.departments = Object.fromEntries(DEPARTMENTS.map(name => [name, {
    coverMapThumbnail: data.mapThumbnails.cover[name] || '',
    verified: false, demo: false, projects: [], photos: [],
  }]));
  for (const project of data.projects.filter(hasContent)) {
    for (const department of project.departments) {
      const record = { ...department, id: project.id + ':' + department.id, name: project.name };
      for (const name of department.names) {
        const target = data.departments[name];
        target.verified ||= isPublished(project);
        target.demo = !target.verified && (target.demo || project.demo);
        target.projects.push(record);
        target.photos.push(...department.photos);
      }
    }
  }
  data.metrics = calculateMetrics(data.projects);
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
  for (const project of input.projects) {
    if (!isObject(project)) throw Error('Cada proyecto debe ser un objeto.');
    if (typeof project.id !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/.test(project.id)) throw Error('Cada proyecto necesita un id único en minúsculas, sin espacios ni tildes.');
    if (ids.has(project.id)) throw Error('Hay identificadores de proyectos repetidos: ' + project.id + '.');
    ids.add(project.id);
    if (typeof project.name !== 'string' || !project.name.trim()) throw Error('Falta el nombre del proyecto ' + project.id + '.');
    const context = project.name;
    for (const field of ['verified', 'demo']) {
      if (project[field] != null && typeof project[field] !== 'boolean') throw Error('Revisa el estado de ' + context + '.');
    }
    if (project.beneficiaries != null && (!Number.isSafeInteger(project.beneficiaries) || project.beneficiaries < 0)) throw Error('La cantidad de personas de ' + context + ' debe ser un entero positivo o quedar vacía.');
    for (const field of ['summary', 'axis']) {
      if (project[field] != null && typeof project[field] !== 'string') throw Error('Revisa ' + field + ' en ' + context + '.');
    }
    for (const field of ['photos', 'activities', 'achievements', 'communities']) {
      if (field in project) throw Error('Mueve ' + field + ' a un bloque de departments dentro de ' + context + '.');
    }
    if (!Array.isArray(project.departments) || (hasContent(project) && !project.departments.length)) throw Error('Revisa la lista de departamentos de ' + context + '.');
    const territoryIds = new Set();
    for (const [index, department] of project.departments.entries()) {
      if (!isObject(department) || !Array.isArray(department.names) || !department.names.length ||
          department.names.some(name => !DEPARTMENTS.includes(name)) || new Set(department.names).size !== department.names.length) {
        throw Error('Revisa names: debe incluir departamentos válidos y sin repetir en ' + context + '.');
      }
      const location = context + ' (' + department.names.join(', ') + ')';
      if (department.id != null && (typeof department.id !== 'string' || !department.id.trim())) throw Error('Revisa el id del bloque territorial en ' + location + '.');
      const territoryId = department.id || project.id + '-territory-' + (index + 1);
      if (territoryIds.has(territoryId)) throw Error('Hay identificadores de bloques territoriales repetidos en ' + location + '.');
      territoryIds.add(territoryId);
      for (const field of ['summary', 'axis']) {
        if (department[field] != null && typeof department[field] !== 'string') throw Error('Revisa ' + field + ' en ' + location + '.');
      }
      for (const field of ['communities', 'activities', 'achievements']) {
        if (department[field] !== undefined && (!Array.isArray(department[field]) || department[field].some(value => typeof value !== 'string' || !value.trim()))) throw Error('Revisa la lista ' + field + ' en ' + location + '.');
      }
      if (department.photos !== undefined && !Array.isArray(department.photos)) throw Error('Revisa la lista de fotografías en ' + location + '.');
      for (const photo of department.photos || []) {
        if (!isObject(photo) || !isImageSource(photo.src)) throw Error('Hay una fotografía con una dirección no válida en ' + location + '.');
        for (const field of ['id', 'community', 'date', 'description', 'thumbnail']) {
          if (photo[field] != null && typeof photo[field] !== 'string') throw Error('Revisa los datos de una fotografía en ' + location + '.');
        }
        for (const field of ['project', 'projectId', 'axis', 'department', 'departments']) {
          if (field in photo) throw Error('El contexto ' + field + ' se hereda del proyecto y su bloque territorial en ' + location + '.');
        }
        if (photo.featured != null && typeof photo.featured !== 'boolean') throw Error('Revisa la fotografía destacada en ' + location + '.');
        if (photo.thumbnail && !isImageSource(photo.thumbnail)) throw Error('Miniatura no válida en ' + location + '.');
        for (const field of ['focalX', 'focalY']) {
          if (photo[field] != null && (!Number.isFinite(photo[field]) || photo[field] < 0 || photo[field] > 100)) throw Error('Revisa el encuadre en ' + location + '.');
        }
        for (const field of ['width', 'height', 'thumbnailWidth']) {
          if (photo[field] != null && (!Number.isSafeInteger(photo[field]) || photo[field] <= 0)) throw Error('Revisa las dimensiones de una fotografía en ' + location + '.');
        }
      }
    }
  }
  return normalizeContent(input);
}
