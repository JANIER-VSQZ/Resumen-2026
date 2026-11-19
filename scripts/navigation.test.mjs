import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdjacentScreen, getDepartmentDestination, getScreenFromHash, getScreenHref } from '../src/navigation.js';

test('arrows connect the cover and general map without selecting a project', () => {
  for (const direction of [-1, 1]) {
    assert.deepEqual(getAdjacentScreen({ view: 'cover' }, direction), { view: 'projects' });
    assert.deepEqual(getAdjacentScreen({ view: 'projects' }, direction), { view: 'cover' });
  }
});

test('the project detail returns to the general map with Left and keeps its selection with Right', () => {
  const current = { view: 'map', selected: 'actuah' };
  assert.deepEqual(getAdjacentScreen(current, -1), { view: 'projects' });
  assert.equal(getAdjacentScreen(current, 1), null);
  assert.deepEqual(current, { view: 'map', selected: 'actuah' });
});

test('project links restore the selected map on reload and support browser history', () => {
  const projects = [{ id: 'actuah' }, { id: 'derechos-humanos' }];
  for (const selected of projects.map(project => project.id)) {
    const screen = { view: 'map', selected };
    assert.deepEqual(getScreenFromHash(getScreenHref(screen), projects), screen);
  }
  assert.deepEqual(getScreenFromHash('', projects), { view: 'cover' });
  assert.deepEqual(getScreenFromHash('#/', projects), { view: 'cover' });
  assert.deepEqual(getScreenFromHash('#/proyectos', projects), { view: 'projects' });
  assert.deepEqual(getScreenFromHash('#/mapa', projects), { view: 'projects' });
  assert.equal(getScreenHref({ view: 'projects' }), '#/mapa');
});

test('missing projects and malformed links lead to the general map', () => {
  for (const hash of ['#/proyectos/desconocido/mapa', '#/proyectos/%ZZ/mapa', '#/proyectos/actuah', '#/otra-pagina']) {
    assert.deepEqual(getScreenFromHash(hash, [{ id: 'actuah' }]), { view: 'projects' });
  }
});

test('a department with one project opens its detail with the chosen department', () => {
  const projects = [{ id: 'actuah', departments: ['Choluteca', 'Comayagua'] }, { id: 'derechos', departments: ['La Paz', 'Intibucá'] }];
  assert.deepEqual(getDepartmentDestination(projects, 'Choluteca'), { view: 'map', selected: 'actuah', department: 'Choluteca' });
  assert.deepEqual(getDepartmentDestination(projects, 'Intibucá'), { view: 'map', selected: 'derechos', department: 'Intibucá' });
});

test('departments with several projects or no projects open the department project page', () => {
  const projects = [{ id: 'a', departments: ['La Paz'] }, { id: 'b', departments: ['La Paz', 'Lempira'] }];
  assert.deepEqual(getDepartmentDestination(projects, 'La Paz'), { view: 'department-projects', department: 'La Paz' });
  assert.deepEqual(getDepartmentDestination(projects, 'Cortés'), { view: 'department-projects', department: 'Cortés' });
  assert.deepEqual(getDepartmentDestination(projects, 'Desconocido'), { view: 'projects' });
});

test('department pages and scoped project links survive reload with accented department names', () => {
  const projects = [{ id: 'a', departments: ['Santa Bárbara', 'Intibucá'] }];
  for (const department of projects[0].departments) {
    for (const screen of [{ view: 'map', selected: 'a', department }, { view: 'department-projects', department }]) {
      assert.deepEqual(getScreenFromHash(getScreenHref(screen), projects), screen);
    }
  }
  assert.deepEqual(getScreenFromHash('#/proyectos/a/mapa?departamento=Cort%C3%A9s', projects), { view: 'map', selected: 'a' });
  for (const hash of ['#/departamentos/%ZZ/proyectos', '#/departamentos/Desconocido/proyectos']) {
    assert.deepEqual(getScreenFromHash(hash, projects), { view: 'projects' });
  }
});

test('department project pages return to the general map without jumping between projects', () => {
  const screen = { view: 'department-projects', department: 'La Paz' };
  assert.deepEqual(getAdjacentScreen(screen, -1), { view: 'projects' });
  assert.equal(getAdjacentScreen(screen, 1), null);
});
