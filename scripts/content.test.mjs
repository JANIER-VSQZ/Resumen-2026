import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateMetrics, normalizeContent, orderedPhotos, photoMatches, validateContent } from '../src/content.js';
import { validateGeo } from '../src/geometry.js';

const projectRecord = (overrides = {}) => ({
  id: 'project-a', name: 'Proyecto A', axis: 'Participación ciudadana',
  communities: ['A', 'B'], activities: ['Actividad 1', 'Actividad 2', 'Actividad 3', 'Actividad 4'],
  achievements: ['Logro 1', 'Logro 2'],
  photos: Array.from({ length: 6 }, (_, index) => ({ src: `/assets/foto-${index}.jpg`, community: index % 2 ? 'B' : 'A' })),
  ...overrides,
});

test('published totals exclude demonstration and draft records, and preserve missing beneficiary counts', () => {
  const record = { verified: true, projects: [projectRecord(), projectRecord({ id: 'project-b', name: 'Proyecto B', communities: ['B', 'C'] })], beneficiaries: 25 };
  const departments = { Lempira: record, Intibucá: { ...record, demo: true }, Cortés: { ...record, verified: false } };
  assert.deepEqual(calculateMetrics(departments), { departments: 1, communities: 3, activities: 8, beneficiaries: 25 });
  departments.Cortés.verified = true;
  departments.Cortés.beneficiaries = null;
  assert.equal(calculateMetrics(departments).beneficiaries, null);
});
test('project photos inherit their context and keep featured order without mutating the JSON', () => {
  const project = projectRecord();
  project.photos[3].featured = true;
  const input = { departments: { Lempira: { verified: false, demo: true, projects: [project] }, Cortés: { verified: true, projects: [] } } };
  const snapshot = structuredClone(input);
  const result = normalizeContent(input);
  assert.equal(result.departments.Lempira.demo, true);
  assert.equal(result.departments.Lempira.verified, false);
  assert.equal(result.departments.Lempira.photos.length, 6);
  assert.equal(result.departments.Lempira.photos[0].src, '/assets/foto-3.jpg');
  assert.deepEqual(result.departments.Lempira.photos.map(photo => [photo.project, photo.projectId, photo.axis]), Array(6).fill(['Proyecto A', 'project-a', 'Participación ciudadana']));
  assert.deepEqual(input, snapshot);
  assert.equal(result.metrics.departments, 1);
});
test('combined filters must match the same photograph and the featured order stays stable', () => {
  const photos = [{ src: 'a', project: 'A', axis: 'X' }, { src: 'b', project: 'B', axis: 'Y', featured: true }, { src: 'c', project: 'A', axis: 'Y' }];
  assert.deepEqual(orderedPhotos(photos).filter(photo => photoMatches(photo, { project: 'A', axis: 'Y' })).map(photo => photo.src), ['c']);
  assert.equal(photos[0].src, 'a');
});
test('cover and interactive map thumbnails remain independent of each other and project photographs', () => {
  const input = { departments: { Lempira: { demo: true, coverMapThumbnail: '/assets/mapas/lempira-portada.jpg', mapThumbnail: '/assets/mapas/lempira.jpg', projects: [projectRecord()] } } };
  const department = validateContent(input).departments.Lempira;
  assert.equal(department.coverMapThumbnail, '/assets/mapas/lempira-portada.jpg');
  assert.equal(department.mapThumbnail, '/assets/mapas/lempira.jpg');
  assert.equal(department.photos.length, 6);
  assert.ok(department.photos.every(photo => photo.src !== department.mapThumbnail && photo.src !== department.coverMapThumbnail));
  input.departments.Lempira.projects[0].photos[0].src = '/assets/otra-foto.jpg';
  input.departments.Lempira.projects[0].photos[0].featured = true;
  assert.equal(validateContent(input).departments.Lempira.mapThumbnail, department.mapThumbnail);
  assert.equal(validateContent(input).departments.Lempira.coverMapThumbnail, department.coverMapThumbnail);
  input.departments.Lempira.mapThumbnail = '/assets/mapas/otro-mapa.jpg';
  assert.equal(validateContent(input).departments.Lempira.coverMapThumbnail, department.coverMapThumbnail);
  input.departments.Lempira.coverMapThumbnail = '';
  assert.equal(validateContent(input).departments.Lempira.mapThumbnail, '/assets/mapas/otro-mapa.jpg');
  assert.equal(department.photos[0].src, '/assets/foto-0.jpg');
});

test('map thumbnails are optional and reject invalid image addresses', () => {
  for (const field of ['coverMapThumbnail', 'mapThumbnail']) {
    const input = value => ({ departments: { Lempira: { [field]: value, projects: [projectRecord()] } } });
    for (const value of [undefined, null, '', '/assets/mapas/lempira.jpg', 'https://example.com/mapa.jpg', 'data:image/png;base64,aGVsbG8=']) assert.doesNotThrow(() => validateContent(input(value)));
    for (const value of [42, {}, [], 'javascript:alert(1)', '//example.com/mapa.jpg', 'mapa.jpg']) assert.throws(() => validateContent(input(value)), new RegExp(`Miniatura del mapa.*${field}`));
  }
});

test('invalid manually edited content fails validation', () => {
  const input = overrides => ({ departments: { Lempira: { projects: [projectRecord()], ...overrides } } });
  assert.throws(() => validateContent(input({ photos: [] })), /Mueve photos/);
  assert.throws(() => validateContent(input({ beneficiaries: -1 })));
  assert.throws(() => validateContent(input({ projects: ['Proyecto antiguo'] })));
  assert.throws(() => validateContent(input({ projects: [projectRecord({ communities: [{}] })] })));
  const invalidPhoto = projectRecord(); invalidPhoto.photos[0].src = 'javascript:alert(1)';
  assert.throws(() => validateContent(input({ projects: [invalidPhoto] })));
  const wrongCommunity = projectRecord(); wrongCommunity.photos[0].community = 'No registrada';
  assert.throws(() => validateContent(input({ projects: [wrongCommunity] })), /comunidad/);
  assert.throws(() => validateContent({ subtitle: {}, departments: {} }));
});

test('each project requires four activities, two achievements and six photos', () => {
  for (const [field, count] of [['activities', 4], ['achievements', 2], ['photos', 6]]) {
    for (const change of [-1, 1]) {
      const project = projectRecord();
      if (change < 0) project[field].pop(); else project[field].push(project[field][0]);
      assert.throws(() => validateContent({ departments: { Lempira: { projects: [project] } } }), new RegExp(String(count)));
    }
  }
  const project = projectRecord({ activities: ['Actividad 1', ' ', 'Actividad 3', 'Actividad 4'] });
  assert.throws(() => validateContent({ departments: { Lempira: { projects: [project] } } }));
  assert.throws(() => validateContent({ departments: { Lempira: { projects: [projectRecord(), projectRecord()] } } }), /repetidos/);
});

test('bundled data has complete project groups and matching map/photo filter context', async () => {
  const input = JSON.parse(await readFile(new URL('../src/content.json', import.meta.url), 'utf8'));
  const result = validateContent(input);
  for (const [name, department] of Object.entries(result.departments)) {
    assert.equal(department.photos.length, department.projects.length * 6);
    assert.equal(input.departments[name].photos, undefined);
    for (const project of department.projects) {
      assert.equal(project.activities.length, 4);
      assert.equal(project.achievements.length, 2);
      assert.equal(department.photos.filter(photo => photoMatches(photo, { project: project.name, axis: project.axis })).length, 6);
    }
  }
});
test('cartography requires distinct Honduran departments and valid coordinates', async () => {
  const geo = JSON.parse(await readFile(new URL('../src/assets/honduras-departments.json', import.meta.url), 'utf8'));
  assert.equal(validateGeo(geo), geo);
  const duplicate = structuredClone(geo);
  duplicate.features[1] = duplicate.features[0];
  assert.throws(() => validateGeo(duplicate));
});
