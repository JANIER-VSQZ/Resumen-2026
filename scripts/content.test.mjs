import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateMetrics, DEPARTMENTS, MAP_THUMBNAIL_CONTEXTS, normalizeContent, orderedPhotos, photoMatches, validateContent } from '../src/content.js';
import { validateGeo } from '../src/geometry.js';

const territory = (overrides = {}) => ({
  names: ['Lempira'], axis: 'Participación ciudadana',
  communities: ['A', 'B'], activities: ['Actividad 1', 'Actividad 2', 'Actividad 3', 'Actividad 4'],
  achievements: ['Logro 1', 'Logro 2'],
  photos: Array.from({ length: 6 }, (_, index) => ({ src: '/FotosProyectos/foto-' + index + '.jpg', community: index % 2 ? 'B' : 'A' })),
  ...overrides,
});
const project = (overrides = {}) => ({ id: 'project-a', name: 'Proyecto A', verified: true, departments: [territory()], ...overrides });
const document = (record = project(), extra = {}) => ({ projects: [record], ...extra });

test('published metrics use project coverage and exclude drafts and demonstrations', () => {
  const projects = [
    project({ beneficiaries: 25 }),
    project({ id: 'b', beneficiaries: 15, departments: [territory({ communities: ['B', 'C'] })] }),
    project({ id: 'demo', demo: true, beneficiaries: 100 }),
    project({ id: 'draft', verified: false, departments: [territory({ names: ['Cortés'] })] }),
  ];
  assert.deepEqual(calculateMetrics(projects), { departments: 1, communities: 3, activities: 8, beneficiaries: 40 });
  projects[3].verified = true;
  assert.equal(calculateMetrics(projects).beneficiaries, null);
  assert.equal(calculateMetrics(projects).departments, 2);
  assert.equal(calculateMetrics([]).beneficiaries, null);
});

test('shared territorial evidence is counted once while all departments remain in coverage', () => {
  const result = validateContent(document(project({ departments: [territory({ names: ['La Paz', 'Intibucá'] })] })));
  assert.equal(result.metrics.departments, 2);
  assert.equal(result.metrics.activities, 4);
  assert.equal(result.metrics.communities, 2);
  assert.equal(result.projects[0].departments[0].photos.length, 6);
  assert.equal(result.departments.Intibucá.photos.length, 6);
  assert.equal(result.departments['La Paz'].photos.length, 6);
});

test('normalization inherits project context and featured order without changing the JSON', () => {
  const input = document(project({ departments: [territory()] }));
  input.projects[0].departments[0].photos[3].featured = true;
  const snapshot = structuredClone(input);
  const result = normalizeContent(input);
  const block = result.projects[0].departments[0];
  assert.equal(block.photos[0].src, '/FotosProyectos/foto-3.jpg');
  assert.deepEqual(block.photos.map(photo => [photo.project, photo.projectId, photo.axis, photo.departments]), Array.from({ length: 6 }, () => ['Proyecto A', 'project-a', 'Participación ciudadana', ['Lempira']]));
  assert.deepEqual(input, snapshot);
  assert.deepEqual(Object.keys(result.departments), DEPARTMENTS);
  assert.equal(result.departments.Lempira.verified, true);
  assert.equal(result.departments.Cortés.verified, false);
});

test('project defaults allow incomplete lists and common summaries while territories can override them', () => {
  const result = validateContent(document(project({
    axis: 'Eje común', summary: 'Resumen común',
    departments: [{ names: ['Choluteca'] }, { names: ['Comayagua'], axis: 'Eje local', summary: 'Resumen local' }],
  })));
  const [first, second] = result.projects[0].departments;
  for (const field of ['communities', 'activities', 'achievements', 'photos']) assert.deepEqual(first[field], []);
  assert.equal(first.axis, 'Eje común');
  assert.equal(first.summary, 'Resumen común');
  assert.equal(second.axis, 'Eje local');
  assert.equal(second.summary, 'Resumen local');
});

test('cover thumbnails are independent of project photographs and do not publish an empty territory', () => {
  const input = document(project(), { mapThumbnails: { cover: { Lempira: '/fotosMapaCover/lempira.jpg', Cortés: '/fotosMapaCover/cortes.jpg' } } });
  const result = validateContent(input);
  assert.equal(result.departments.Cortés.coverMapThumbnail, '/fotosMapaCover/cortes.jpg');
  assert.equal(result.departments.Cortés.verified, false);
  assert.equal(result.projects[0].departments[0].photos.length, 6);
  input.projects[0].departments[0].photos[0].src = '/FotosProyectos/otra.jpg';
  assert.equal(validateContent(input).departments.Lempira.coverMapThumbnail, '/fotosMapaCover/lempira.jpg');
});

test('map thumbnails accept public folders and reject invalid sources and unknown departments', () => {
  for (const context of MAP_THUMBNAIL_CONTEXTS) {
  for (const value of ['', '/assets/mapas/lempira.jpg', '/fotosMapaCover/lempira.JPG', 'https://example.com/mapa.jpg', 'data:image/png;base64,aGVsbG8=']) {
    assert.doesNotThrow(() => validateContent(document(project(), { mapThumbnails: { [context]: { Lempira: value } } })));
  }
  for (const value of [null, 42, {}, [], 'javascript:alert(1)', '//example.com/mapa.jpg', '/\\example.com/mapa.jpg', 'mapa.jpg']) {
    assert.throws(() => validateContent(document(project(), { mapThumbnails: { [context]: { Lempira: value } } })), /Miniatura/);
  }
  assert.throws(() => validateContent(document(project(), { mapThumbnails: { [context]: { Desconocido: '/foto.jpg' } } })), /Departamento/);
  assert.throws(() => validateContent(document(project(), { mapThumbnails: { [context]: [] } })), /objeto/);
  }
  assert.throws(() => validateContent(document(project(), { mapThumbnails: { Lempira: '/foto.jpg' } })), /cover, interactive o detail/);
});

test('the three map image sets remain independent and empty maps never inherit cover or gallery images', () => {
  const input = document(project(), { mapThumbnails: { cover: { Lempira: '/cover.jpg' }, interactive: { Lempira: '/interactive.jpg' }, detail: { Lempira: '/detail.jpg' } } });
  const snapshot = structuredClone(input);
  const result = validateContent(input);
  assert.equal(result.departments.Lempira.coverMapThumbnail, '/cover.jpg');
  assert.equal(result.mapThumbnails.interactive.Lempira, '/interactive.jpg');
  assert.equal(result.mapThumbnails.detail.Lempira, '/detail.jpg');
  assert.equal(result.projects[0].departments[0].photos.length, 6);
  input.mapThumbnails.interactive.Lempira = '';
  const changed = validateContent(input);
  assert.equal(changed.mapThumbnails.interactive.Lempira, '');
  assert.equal(changed.mapThumbnails.cover.Lempira, '/cover.jpg');
  assert.equal(changed.mapThumbnails.detail.Lempira, '/detail.jpg');
  assert.equal(result.mapThumbnails.interactive.Lempira, '/interactive.jpg');
  assert.equal(snapshot.mapThumbnails.interactive.Lempira, '/interactive.jpg');
  const empty = validateContent(document(project(), { mapThumbnails: { cover: { Lempira: '/cover.jpg' } } }));
  assert.deepEqual(empty.mapThumbnails.interactive, {});
  assert.deepEqual(empty.mapThumbnails.detail, {});
});

test('manual errors identify projects, territories, lists and photograph fields', () => {
  assert.throws(() => validateContent({ departments: {} }), /projects/);
  assert.throws(() => validateContent({ projects: [], departments: {} }), /projects\[\].departments/);
  assert.throws(() => validateContent(document(project({ beneficiaries: -1 }))), /personas/);
  assert.throws(() => validateContent(document(project({ verified: 'true' }))), /estado/);
  assert.throws(() => validateContent(document(project({ id: 'Proyecto con tildes' }))), /id/);
  assert.throws(() => validateContent({ projects: [project(), project()] }), /repetidos/);
  assert.throws(() => validateContent(document(project({ name: ' ' }))), /nombre/);
  assert.throws(() => validateContent(document(project({ departments: [] }))), /departamentos/);
  assert.throws(() => validateContent(document(project({ photos: [] }))), /Mueve photos/);
  for (const names of [[], ['No existe'], ['La Paz', 'La Paz'], 'La Paz']) {
    assert.throws(() => validateContent(document(project({ departments: [territory({ names })] }))), /names/);
  }
  for (const field of ['activities', 'communities', 'achievements']) {
    assert.throws(() => validateContent(document(project({ departments: [territory({ [field]: [' '] })] }))), /lista/);
  }
  assert.throws(() => validateContent(document(project({ departments: [territory({ photos: {} })] }))), /fotografías/);
  assert.throws(() => validateContent(document(project(), { subtitle: {} })), /subtitle/);
  for (const photo of [{ src: 'javascript:alert(1)' }, { src: '//example.com/foto.png' }, { src: '/\\example.com/foto.png' }, { src: '/foto.png', community: {} }, { src: '/foto.png', focalX: 101 }, { src: '/foto.png', width: 0 }, { src: '/foto.png', projectId: 'otro' }]) {
    assert.throws(() => validateContent(document(project({ departments: [territory({ photos: [photo] })] }))));
  }
});

test('drafts may be created before their first territory and remain absent from the map', () => {
  const result = validateContent(document(project({ verified: false, departments: [] })));
  assert.equal(result.metrics.departments, 0);
  assert.ok(Object.values(result.departments).every(department => !department.verified && !department.demo));
});

test('bundled content and the copyable template use the project-first format', async () => {
  const input = JSON.parse(await readFile(new URL('../src/content.json', import.meta.url), 'utf8'));
  const template = JSON.parse(await readFile(new URL('../docs/plantilla-proyecto.json', import.meta.url), 'utf8'));
  assert.doesNotThrow(() => validateContent(document(template)));
  assert.equal(input.departments, undefined);
  const result = validateContent(input);
  for (const record of result.projects) {
    for (const block of record.departments) {
      assert.equal(block.photos.filter(photo => photoMatches(photo, { project: record.name, axis: block.axis })).length, block.photos.length);
    }
  }
});

test('combined filters and featured order stay stable', () => {
  const photos = [{ src: 'a', project: 'A', axis: 'X' }, { src: 'b', project: 'B', axis: 'Y', featured: true }, { src: 'c', project: 'A', axis: 'Y' }];
  assert.deepEqual(orderedPhotos(photos).filter(photo => photoMatches(photo, { project: 'A', axis: 'Y' })).map(photo => photo.src), ['c']);
  assert.equal(photos[0].src, 'a');
});

test('cartography requires distinct Honduran departments and valid coordinates', async () => {
  const geo = JSON.parse(await readFile(new URL('../src/assets/honduras-departments.json', import.meta.url), 'utf8'));
  assert.equal(validateGeo(geo), geo);
  const duplicate = structuredClone(geo);
  duplicate.features[1] = duplicate.features[0];
  assert.throws(() => validateGeo(duplicate));
});
