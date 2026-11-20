import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { prepareMap } from '../src/geometry.js';
import { buildProjectCatalog, getDepartmentProjects } from '../src/projects.js';

let server, DepartmentProjectsPage, features;
before(async () => {
  server = await createServer({ configFile: false, server: { middlewareMode: true, watch: { ignored: ['**/release/**', '**/dist/**'] } } });
  DepartmentProjectsPage = (await server.ssrLoadModule('/src/pages/DepartmentProjectsPage.jsx')).default;
  features = prepareMap(JSON.parse(await readFile(new URL('../src/assets/honduras-departments.json', import.meta.url), 'utf8')));
});
after(async () => { await server?.close(); });

const project = (id, name) => ({
  id, name, verified: true,
  departments: [
    { names: ['Choluteca'], communities: ['Centro'], activities: ['ACTIVIDAD ' + name], achievements: ['LOGRO ' + name], photos: [{ src: '/assets/' + id + '.jpg', description: 'FOTO ' + name }] },
    { names: ['Comayagua'], activities: ['OTRO TERRITORIO ' + name], photos: [{ src: '/assets/otro-' + id + '.jpg', description: 'FOTO DE OTRO TERRITORIO ' + name }] },
  ],
});

test('multiple projects show maps, activities, achievements and photos together without a selection step', () => {
  const catalog = buildProjectCatalog([project('a', 'Proyecto A'), project('b', 'Proyecto B')]);
  const html = renderToStaticMarkup(React.createElement(DepartmentProjectsPage, {
    department: 'Choluteca', projects: getDepartmentProjects(catalog, 'Choluteca'), period: '2026', features,
    thumbnails: { Choluteca: '/assets/mapa-choluteca.jpg' }, onBack: () => {}, onHome: () => {},
  }));
  assert.equal((html.match(/data-project-detail=/g) || []).length, 2);
  assert.equal((html.match(/class="honduras-map"/g) || []).length, 2);
  assert.equal((html.match(/class="gallery-img\b/g) || []).length, 2);
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal(html.includes('data-project-link='), false);
  assert.match(html, /data-department-project-filter/);
  assert.match(html, /Todos los proyectos/);
  for (const name of ['Proyecto A', 'Proyecto B']) {
    for (const label of ['ACTIVIDAD ', 'LOGRO ', 'FOTO ']) assert.ok(html.includes(label + name));
    assert.equal(html.includes('OTRO TERRITORIO ' + name), false);
  }
  const ids = [...html.matchAll(/(?:^|\s)id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Each project and map needs its own element IDs.');
  const clips = [...html.matchAll(/clip-path="url\(#([^)]+)\)"/g)].map(match => match[1]);
  assert.equal(clips.length, 2);
  assert.equal(new Set(clips).size, 2, 'Both maps must clip thumbnails against their own department shapes.');
  for (const clip of clips) assert.ok(ids.includes(clip));
});

test('a department without projects keeps its empty state and map navigation', () => {
  const html = renderToStaticMarkup(React.createElement(DepartmentProjectsPage, { department: 'Cortés', projects: [], period: '2026', features, onBack: () => {}, onHome: () => {} }));
  assert.ok(html.includes('Todavía no hay proyectos publicados en Cortés'));
  assert.ok(html.includes('Volver al mapa'));
  assert.equal(html.includes('data-project-detail='), false);
});
