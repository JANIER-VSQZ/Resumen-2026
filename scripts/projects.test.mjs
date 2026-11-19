import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildProjectCatalog, filterProjectCatalog, getDepartmentProjects } from '../src/projects.js';

const territory = (name, extra = {}) => ({ names: [name], activities: ['Actividad en ' + name], photos: [{ src: '/foto.jpg', description: name }], ...extra });
const project = (extra = {}) => ({ id: 'actuah', name: 'ACTUAH', verified: true, departments: [territory('Choluteca'), territory('Comayagua'), territory('Santa Bárbara')], ...extra });

test('one project contains its territories and keeps each intervention and photograph together', () => {
  const input = [project()];
  const snapshot = structuredClone(input);
  const [item] = buildProjectCatalog(input);
  assert.deepEqual(item.departments, ['Choluteca', 'Comayagua', 'Santa Bárbara']);
  assert.equal(item.activityCount, 3);
  assert.equal(item.entries.length, 3);
  assert.deepEqual(item.photos.map(photo => photo.department), ['Choluteca', 'Comayagua', 'Santa Bárbara']);
  assert.deepEqual(input, snapshot);
});

test('shared departmental blocks highlight all locations without duplicating evidence', () => {
  const [item] = buildProjectCatalog([project({ departments: [territory('La Paz', { names: ['La Paz', 'Intibucá'] })] })]);
  assert.deepEqual(item.departments, ['Intibucá', 'La Paz']);
  assert.equal(item.photos.length, 1);
  assert.equal(item.activityCount, 1);
  assert.equal(item.entries.filter(entry => entry.departments.includes('Intibucá')).length, 1);
});

test('stable project IDs survive name edits and equal names do not merge different projects', () => {
  const result = buildProjectCatalog([project(), project({ id: 'otro', name: 'ACTUAH' })]);
  assert.equal(result.length, 2);
  assert.deepEqual(new Set(result.map(item => item.id)), new Set(['actuah', 'otro']));
  assert.equal(buildProjectCatalog([project({ name: 'Nombre actualizado' })])[0].id, 'actuah');
});

test('drafts are hidden and published and demo projects keep separate evidence', () => {
  const result = buildProjectCatalog([
    project(), project({ id: 'demo', demo: true, departments: [territory('Cortés')] }),
    project({ id: 'draft', verified: false, departments: [territory('Lempira')] }),
  ]);
  assert.equal(result.length, 2);
  assert.deepEqual(result.find(item => item.id === 'actuah').departments, ['Choluteca', 'Comayagua', 'Santa Bárbara']);
  assert.equal(result.find(item => item.id === 'demo').demo, true);
  assert.deepEqual(buildProjectCatalog([]), []);
});

test('partially entered territories provide usable empty arrays and unique view entries', () => {
  const [result] = buildProjectCatalog([project({ departments: [{ names: ['Lempira'] }, { names: ['Lempira'], activities: ['Segunda actividad'] }] })]);
  assert.equal(result.photos.length, 0);
  assert.equal(result.activityCount, 1);
  assert.equal(new Set(result.entries.map(entry => entry.id)).size, 2);
  assert.deepEqual(result.entries[0].project.communities, []);
});

test('the current catalog preserves all published project evidence and explicit geographic coverage', async () => {
  const input = JSON.parse(await readFile(new URL('../src/content.json', import.meta.url), 'utf8'));
  const result = buildProjectCatalog(input.projects);
  const visible = input.projects.filter(project => project.demo || project.verified);
  assert.equal(result.length, visible.length);
  for (const record of visible) {
    const item = result.find(project => project.id === record.id);
    assert.deepEqual(item.departments, [...new Set(record.departments.flatMap(department => department.names))].sort((a, b) => a.localeCompare(b, 'es')));
    assert.equal(item.photos.length, record.departments.reduce((count, department) => count + (department.photos || []).length, 0));
    assert.equal(item.activityCount, record.departments.reduce((count, department) => count + (department.activities || []).length, 0));
  }
});

test('combined overview filters keep only matching interventions and their actual coverage', () => {
  const catalog = buildProjectCatalog([
    project({ departments: [territory('Choluteca', { axis: 'Formación' }), territory('Comayagua', { axis: 'Organización' })] }),
    project({ id: 'otro', departments: [territory('Lempira', { axis: 'Organización' })] }),
  ]);
  const snapshot = structuredClone(catalog);
  const result = filterProjectCatalog(catalog, { project: 'actuah', axis: 'Organización' });
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].departments, ['Comayagua']);
  assert.equal(result[0].activityCount, 1);
  assert.equal(result[0].photos.length, 1);
  assert.deepEqual(catalog, snapshot);
});

test('overview filters can show all projects, match an activity across projects or have no results', () => {
  const catalog = buildProjectCatalog([
    project({ departments: [territory('Choluteca', { axis: 'Formación' })] }),
    project({ id: 'otro', departments: [territory('La Paz', { axis: 'Derechos humanos' })] }),
  ]);
  assert.equal(filterProjectCatalog(catalog, {}).length, 2);
  assert.deepEqual(filterProjectCatalog(catalog, { axis: 'Derechos humanos' }).map(project => project.id), ['otro']);
  assert.deepEqual(filterProjectCatalog(catalog, { project: 'actuah', axis: 'Derechos humanos' }), []);
  assert.deepEqual(filterProjectCatalog([], {}), []);
});

test('department details select matching projects while preserving all their evidence and coverage', () => {
  const catalog = buildProjectCatalog([
    project({ departments: [territory('Choluteca', { axis: 'Formación' }), territory('Choluteca', { axis: 'Organización' }), territory('Comayagua')] }),
    project({ id: 'segundo', departments: [territory('Choluteca', { axis: 'Formación' })] }),
    project({ id: 'otro-departamento', departments: [territory('La Paz', { axis: 'Formación' })] }),
  ]);
  const result = getDepartmentProjects(catalog, 'Choluteca', { axis: 'Formación' });
  assert.deepEqual(result.map(project => project.id), ['actuah', 'segundo']);
  assert.equal(result[0], catalog[0]);
  assert.equal(result[0].entries.length, 3);
  assert.deepEqual(result[0].departments, ['Choluteca', 'Comayagua']);
  assert.equal(getDepartmentProjects(catalog, 'Choluteca', { project: 'segundo' }).length, 1);
  assert.deepEqual(getDepartmentProjects(catalog, 'Cortés'), []);
});
