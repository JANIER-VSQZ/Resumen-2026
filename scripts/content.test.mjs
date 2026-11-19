import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEPARTMENTS, MAP_THUMBNAIL_CONTEXTS, normalizeContent, orderedPhotos, validateContent } from '../src/content.js';
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

test('cover publication states distinguish published projects, drafts and demonstrations', () => {
  const projects = [
    project(),
    project({ id: 'demo', demo: true, departments: [territory({ names: ['La Paz'] })] }),
    project({ id: 'shared-demo', demo: true }),
    project({ id: 'draft', verified: false, departments: [territory({ names: ['Cortés'] })] }),
  ];
  const result = validateContent({ projects });
  assert.equal(result.departments.Lempira.verified, true);
  assert.equal(result.departments.Lempira.demo, false);
  assert.equal(result.departments['La Paz'].verified, false);
  assert.equal(result.departments['La Paz'].demo, true);
  assert.equal(result.departments.Cortés.verified, false);
  assert.equal(result.departments.Cortés.demo, false);
  const reversed = validateContent({ projects: [...projects].reverse() });
  assert.deepEqual(reversed.departments, result.departments, 'A demonstration must not override a published territory.');
  projects[3].verified = true;
  assert.equal(validateContent({ projects }).departments.Cortés.verified, true);
});

test('shared evidence stays in its project while all departments remain published on the cover', () => {
  const result = validateContent(document(project({ departments: [territory({ names: ['La Paz', 'Intibucá'] })] })));
  const [block] = result.projects[0].departments;
  assert.equal(block.photos.length, 6);
  assert.equal(block.activities.length, 4);
  assert.equal(block.communities.length, 2);
  assert.equal(result.departments.Intibucá.verified, true);
  assert.equal(result.departments['La Paz'].verified, true);
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
  assert.deepEqual(result.projects[0].departments, []);
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
      assert.ok(block.photos.every(photo => photo.project === record.name && photo.axis === block.axis));
    }
  }
});

test('featured photos sort first while preserving the order of the other photos and the input', () => {
  const photos = [{ src: 'a', project: 'A', axis: 'X' }, { src: 'b', project: 'B', axis: 'Y', featured: true }, { src: 'c', project: 'A', axis: 'Y' }];
  assert.deepEqual(orderedPhotos(photos).map(photo => photo.src), ['b', 'a', 'c']);
  assert.equal(photos[0].src, 'a');
});

test('cartography requires distinct Honduran departments and valid coordinates', async () => {
  const geo = JSON.parse(await readFile(new URL('../src/assets/honduras-departments.json', import.meta.url), 'utf8'));
  assert.equal(validateGeo(geo), geo);
  const duplicate = structuredClone(geo);
  duplicate.features[1] = duplicate.features[0];
  assert.throws(() => validateGeo(duplicate));
});
