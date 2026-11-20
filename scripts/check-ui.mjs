import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeContent } from '../src/content.js';
import { PHOTO_VIEWER_ENABLED } from '../src/config.js';
import { buildProjectCatalog, getDepartmentProjects } from '../src/projects.js';
import { getDepartmentDestination, getScreenHref } from '../src/navigation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const desktop = process.argv.includes('--desktop');
const work = await mkdtemp(path.join(tmpdir(), 'asonog-ui-'));
const profile = path.join(work, 'profile');
let server, browser, ws, browserError, captureFailure, closeBrowser;
let stderr = '';
const pending = new Map();
const keepAlive = setInterval(() => {}, 1000);
try {
  const executable = desktop ? path.resolve(root, process.argv.slice(2).find(argument => /\.exe$/i.test(argument)) || 'release/ASONOG-proyectos-2026.exe') : process.env.ASONOG_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  await access(executable);
  let origin;
  if (!desktop) {
    const { createServer } = await import('vite');
    server = await createServer({ root, server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/release/**', '**/dist/**'] } } });
    await server.listen(); origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  }
  const environment = { ...process.env }; delete environment.ELECTRON_RUN_AS_NODE;
  const args = ['--remote-debugging-port=0', '--user-data-dir=' + profile, ...(desktop ? ['--hidden'] : ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', 'about:blank'])];
  browser = spawn(executable, args, { cwd: desktop ? work : root, windowsHide: true, env: environment, stdio: ['ignore', 'ignore', 'pipe'] });
  browser.stderr.on('data', chunk => { stderr += chunk; });
  browser.once('error', error => { browserError = error; });
  let endpoint;
  for (let attempt = 0; attempt < 200; attempt++) {
    if (browserError) throw browserError;
    endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
    if (!endpoint) try {
      const [port] = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).trim().split(/\r?\n/);
      endpoint = (await (await fetch('http://127.0.0.1:' + port + '/json/version')).json()).webSocketDebuggerUrl;
    } catch { /* Wait for the owned browser. */ }
    if (endpoint) break;
    if (browser.exitCode != null) throw Error('Browser closed: ' + stderr.slice(-1000));
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(endpoint, 'No debugging endpoint. ' + stderr.slice(-2000));
  ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const exceptions = [], remoteRequests = [], remoteImageRequests = [], errors = [];
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(argument => argument.value || argument.description).join(' '));
    if (message.method === 'Network.requestWillBeSent') {
      const url = message.params.request.url;
      if (/^https?:/.test(url) && (!origin || !url.startsWith(origin + '/'))) {
        if (!desktop && message.params.type === 'Image') remoteImageRequests.push(url);
        else remoteRequests.push(url);
      }
    }
    const call = pending.get(message.id);
    if (call) { clearTimeout(call.timer); pending.delete(message.id); message.error ? call.reject(Error(JSON.stringify(message.error))) : call.resolve(message.result); }
  };
  ws.onclose = () => { for (const call of pending.values()) { clearTimeout(call.timer); call.reject(Error('Browser closed.')); } pending.clear(); };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('Timeout: ' + method)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  closeBrowser = () => ws.readyState === WebSocket.OPEN ? send('Browser.close') : Promise.resolve();
  let target;
  for (let attempt = 0; attempt < 100; attempt++) {
    const { targetInfos } = await send('Target.getTargets');
    target = targetInfos.find(target => target.type === 'page' && (!desktop || target.url.startsWith('asonog://app/')));
    if (target) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(target);
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const command = (method, params = {}) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw Error('Condition not met: ' + expression);
  };
  const settle = () => evaluate(desktop ? 'new Promise(resolve => setTimeout(resolve, 50))' : 'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
  const click = async selector => {
    await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw Error('Missing element: ' + ${JSON.stringify(selector)}); element.focus({preventScroll:true}); if (typeof element.click === 'function') element.click(); else element.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:0})); })()`);
    await settle();
  };
  const select = async (selector, value) => {
    await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); element.value = ${JSON.stringify(value)}; element.dispatchEvent(new Event('change', {bubbles:true})); })()`);
    await settle();
  };
  const press = async (key, options = {}) => {
    const codes = { ArrowLeft: 37, ArrowRight: 39, Escape: 27, Enter: 13, ' ': 32 };
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: codes[key], ...options });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: codes[key], modifiers: options.modifiers || 0 });
    await settle();
  };
  const focus = selector => evaluate('document.querySelector(' + JSON.stringify(selector) + ').focus({ preventScroll: true })');
  const assertScreen = async (view, selected) => {
    const screen = await evaluate("(() => { const main = document.querySelector('main'); return { view: main.classList.contains('cover') ? 'cover' : main.classList.contains('department-projects-page') ? 'department-projects' : main.classList.contains('projectsview') ? 'projects' : 'map', selected: main.dataset.selectedProject || null }; })()");
    assert.deepEqual(screen, { view, selected: selected || null });
  };
  const viewport = async (width, height) => { await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 641 }); await settle(); };
  const reload = async (ready = "document.querySelectorAll('.preview-department').length === 18 && !!document.querySelector('.cover-copy > p')") => {
    await evaluate("document.documentElement.dataset.checkReload = 'pending'");
    await command('Page.reload');
    await waitFor("document.documentElement.dataset.checkReload !== 'pending' && (" + ready + ")");
  };
  // Hidden Electron windows do not expose a screenshot surface on Windows.
  // Visual screenshots come from the web run; desktop checks use the same DOM/layout assertions.
  const screenshot = async name => { if (desktop) return; await settle(); const { data } = await command('Page.captureScreenshot', { format: 'png' }); await writeFile(path.join(work, name + '.png'), Buffer.from(data, 'base64')); };
  captureFailure = async () => { console.error('Screenshots:', work); console.error('Console:', JSON.stringify(errors)); console.error('Exceptions:', JSON.stringify(exceptions)); await screenshot('failure'); };
  await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable');
  await viewport(1366, 768);
  if (!desktop) await command('Page.navigate', { url: origin });
  await waitFor("document.querySelectorAll('.preview-department').length === 18");
  await evaluate('document.fonts.ready');
  if (desktop) {
    await command('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await reload();
    assert.equal(await evaluate('navigator.onLine'), false);
  }
  await screenshot('cover-desktop');
  const content = normalizeContent(JSON.parse(await readFile(path.join(root, 'src/content.json'), 'utf8')));
  // Old per-computer edits must not override the manually maintained project files.
  const stale = { ...content, subtitle: 'OUTDATED_LOCAL_CONTENT', departments: {} };
  await evaluate('(async () => { const stale = ' + JSON.stringify(stale) + '; localStorage.setItem("asonog-2026-content", JSON.stringify(stale)); await new Promise((resolve, reject) => { const request = indexedDB.open("asonog-exposition-2026", 1); request.onupgradeneeded = () => request.result.createObjectStore("files"); request.onerror = () => reject(request.error); request.onsuccess = () => { const db = request.result; const tx = db.transaction("files", "readwrite"); tx.objectStore("files").put(stale, "content-v2"); tx.objectStore("files").put({ type: "FeatureCollection", features: [] }, "hnd-adm1"); tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }; }); })()');
  await reload();
  assert.equal(await evaluate("document.querySelector('.cover-copy > p').textContent"), content.subtitle, 'Old local edits replaced the project content.');
  assert.equal(await evaluate("document.querySelector('.admin-trigger, .admin-modal, [aria-label=\"Editar contenido\"], input[type=\"file\"], form, textarea') === null"), true, 'Editing controls remain in the presentation.');
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('asonog-2026-content')).subtitle"), stale.subtitle, 'Old data should be left untouched.');
  console.log('Presentation uses bundled content and has no editing controls.');

  const projects = buildProjectCatalog(content.projects);
  const assertOverviewDepartmentCleared = async (expectedProjects = projects) => {
    await assertScreen('projects');
    assert.equal(await evaluate("document.querySelectorAll('.map-explorer-page .department.is-selected').length"), 0, 'Returning to the general map must clear the department selection.');
    assert.equal(await evaluate("document.querySelector('.overview-clear-department') === null"), true);
    assert.equal(await evaluate("document.querySelector('#overview-results-title').textContent"), 'Proyectos disponibles');
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.map-project-result')].map(node=>node.dataset.projectLink).sort()"), expectedProjects.map(project => project.id).sort(), 'The results must follow the project filters without retaining a department.');
  };
  const assertDepartmentLocked = async (name, pointer = false) => {
    const snapshot = () => evaluate("({hash:location.hash,selected:[...document.querySelectorAll('.department.is-selected')].map(node=>node.dataset.department),photos:[...document.querySelectorAll('.gallery-img img')].map(node=>node.getAttribute('src')),activities:[...document.querySelectorAll('.project-activities li')].map(node=>node.textContent)})");
    const before = await snapshot();
    assert.ok(before.selected.length > 0);
    assert.ok(before.selected.every(department => department === name));
    assert.equal(await evaluate("[...document.querySelectorAll('.honduras-map .department:not(.is-selected)')].every(node=>node.getAttribute('aria-disabled')==='true'&&node.tabIndex===-1)"), true);
    assert.equal(await evaluate("document.querySelectorAll('.project-evidence-heading .back').length"), 0, 'Department details must keep the evidence scoped to the chosen department.');
    const ids = await evaluate("[...document.querySelectorAll('[data-project-detail]')].map(node=>node.dataset.projectDetail)");
    for (const id of ids) {
      const root = '[data-project-detail=' + JSON.stringify(id) + ']';
      const other = root + ' .is-project-location:not(.is-selected)';
      if (!await evaluate('!!document.querySelector(' + JSON.stringify(other) + ')')) continue;
      await click(other); await press('Enter'); await press(' ');
      assert.deepEqual(await snapshot(), before, 'Disabled map regions and capsules must not change the department or evidence.');
      if (pointer && !desktop) {
        await evaluate('document.querySelector(' + JSON.stringify(root + ' .map-panel') + ').scrollIntoView({block:"center"})');
        const tap = await evaluate("(()=>{const path=document.querySelector(" + JSON.stringify(other + ' .department-hit-area') + ");const box=path.getBBox();for(let row=1;row<10;row++)for(let col=1;col<10;col++){const point=new DOMPoint(box.x+box.width*col/10,box.y+box.height*row/10);if(path.isPointInFill(point)){const screen=point.matrixTransform(path.getScreenCTM());return {x:screen.x,y:screen.y}}}})()");
        assert.ok(tap);
        await command('Input.dispatchMouseEvent', { type: 'mousePressed', ...tap, button: 'left', clickCount: 1 });
        await command('Input.dispatchMouseEvent', { type: 'mouseReleased', ...tap, button: 'left', clickCount: 1 });
        await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, ...tap }] });
        await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await settle();
        assert.deepEqual(await snapshot(), before, 'Mouse and touch must respect the locked department.');
      }
    }
    const original = await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')");
    await click('[aria-label="Ampliar mapa"]');
    assert.notEqual(await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')"), original, 'The map must still support zoom in department details.');
    await click('[aria-label="Mostrar todo Honduras"]');
    assert.deepEqual(await snapshot(), before);
    await focus('#main-content');
    await evaluate('window.scrollTo(0,0)');
  };
  const layouts = [];
  const imageSources = [
    ...projects.flatMap(project => project.photos.flatMap(photo => [photo.src, photo.thumbnail])),
    ...Object.values(content.mapThumbnails || {}).flatMap(thumbnails => Object.values(thumbnails)),
  ].filter(Boolean);
  for (const src of imageSources) {
    if (src.startsWith('/') && !src.startsWith('//')) assert.equal(await evaluate('fetch(' + JSON.stringify(src) + ').then(response=>response.ok)'), true, src);
    else assert.ok(src.startsWith('data:image/') || (!desktop && /^https?:\/\//i.test(src)));
  }
  const coverImages = Object.values(content.mapThumbnails.cover).filter(Boolean).length;
  assert.equal(await evaluate("document.querySelectorAll('.preview-department image').length"), coverImages, 'The cover must retain its own thumbnails.');
  await click('.map-preview-open'); await assertScreen('projects');
  assert.equal(await evaluate("!!document.querySelector('.map-explorer-page')"), true);
  assert.equal(await evaluate("document.querySelectorAll('.honduras-map .department').length"), 18);
  assert.equal(await evaluate("document.querySelectorAll('.honduras-map image').length"), Object.values(content.mapThumbnails.interactive).filter(Boolean).length, 'The interactive map must not inherit cover thumbnails.');
  const projectDepartments = [...new Set(projects.flatMap(project => project.departments))].sort();
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.department.has-content')].map(node=>node.dataset.department).sort()"), projectDepartments);
  assert.equal(await evaluate("(()=>{const active=document.querySelector('.department.has-content .dept-base');const empty=document.querySelector('.department:not(.has-content) .dept-base');return !active||!empty||getComputedStyle(active).fill!==getComputedStyle(empty).fill;})()"), true, 'Project coverage must use a different color.');
  assert.equal(await evaluate("document.querySelectorAll('.map-project-result').length"), projects.length);
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.map-project-result h3')].map(node=>node.textContent)"), projects.map(project => project.name));
  assert.equal(await evaluate("document.activeElement.id"), 'main-content');
  assert.equal(await evaluate("document.querySelector('.map-labels').getBoundingClientRect().left > document.querySelector('.map-explorer-heading').getBoundingClientRect().right"), true, 'Map controls must not overlap the title.');
  await click('.skip-link'); await assertScreen('projects');
  await focus('.topbar .iconbutton'); await press('ArrowLeft'); await assertScreen('cover');
  await click('.map-preview-open'); await assertScreen('projects');
  await press('ArrowRight', { autoRepeat: true }); await assertScreen('projects');
  await press('ArrowRight', { modifiers: 2 }); await assertScreen('projects');
  await click('.global-footer button'); await press('ArrowRight'); await assertScreen('cover');
  assert.equal(await evaluate("!document.querySelector('.help-modal') && !document.querySelector('main').inert"), true);
  await click('.map-preview-open'); await assertScreen('projects');

  if (projects.length) {
    const project = projects[0];
    await select('#overview-project', project.id);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.department:not(.filtered-out)')].map(node=>node.dataset.department).sort()"), [...project.departments].sort());
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.map-project-result')].map(node=>node.dataset.projectLink)"), [project.id]);
    const axis = project.entries.find(entry => entry.project.axis)?.project.axis;
    if (axis) {
      await select('#overview-axis', axis);
      const coverage = [...new Set(project.entries.filter(entry => entry.project.axis === axis).flatMap(entry => entry.departments))].sort();
      assert.deepEqual(await evaluate("[...document.querySelectorAll('.department:not(.filtered-out)')].map(node=>node.dataset.department).sort()"), coverage);
      await focus('#overview-axis'); await press('ArrowLeft'); await assertScreen('projects');
      await select('#overview-axis', axis);
      await click('[data-project-link="' + project.id + '"]'); await assertScreen('map', project.id);
      assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), project.photos.length, 'The detail must retain the complete project.');
      await click('.project-page-nav .back'); await assertScreen('projects');
      assert.equal(await evaluate("document.querySelector('#overview-project').value"), project.id);
      assert.equal(await evaluate("document.querySelector('#overview-axis').value"), axis);
      await click('[data-department=' + JSON.stringify(coverage[0]) + ']');
      await assertScreen('map', project.id);
      await assertDepartmentLocked(coverage[0]);
      await click('.project-page-nav .back');
      await assertOverviewDepartmentCleared([project]);
      assert.equal(await evaluate("document.querySelector('#overview-project').value"), project.id);
      assert.equal(await evaluate("document.querySelector('#overview-axis').value"), axis);
      const other = projects.find(item => item.id !== project.id && !item.entries.some(entry => entry.project.axis === axis));
      if (other) {
        await select('#overview-project', other.id);
        assert.equal(await evaluate("document.querySelector('#overview-axis').value"), '', 'Changing projects should clear an incompatible activity filter.');
      }
    }
    await click('.map-clear-filters');
    const assertDepartmentDestination = async (name, checkFocus = true) => {
      const destination = getDepartmentDestination(projects, name);
      await assertScreen(destination.view, destination.selected);
      if (checkFocus) assert.equal(await evaluate("document.activeElement.id"), 'main-content');
      if (destination.view === 'map') {
        const item = projects.find(project => project.id === destination.selected);
        const entries = item.entries.filter(entry => entry.departments.includes(name));
        assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), entries.reduce((count, entry) => count + entry.project.photos.length, 0));
        assert.equal(await evaluate("document.querySelector('.department.is-selected')?.dataset.department"), name);
        assert.equal(await evaluate("new URLSearchParams(location.hash.split('?')[1]||'').get('departamento')"), name);
      } else {
        assert.equal(await evaluate("document.querySelector('main').dataset.departmentProjects"), name);
        assert.deepEqual(await evaluate("[...document.querySelectorAll('[data-project-detail]')].map(node=>node.dataset.projectDetail).sort()"), projects.filter(project => project.departments.includes(name)).map(project => project.id).sort());
        const expected = getDepartmentProjects(projects, name);
        assert.equal(await evaluate("document.querySelectorAll('.honduras-map').length"), expected.length);
        assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), expected.reduce((count, project) => count + project.entries.filter(entry => entry.departments.includes(name)).reduce((total, entry) => total + entry.project.photos.length, 0), 0));
      }
      return destination;
    };
    const name = project.departments[0];
    await click('[data-department=' + JSON.stringify(name) + ']');
    const destination = await assertDepartmentDestination(name);
    await assertDepartmentLocked(name, true);
    await reload(destination.view === 'map' ? "document.querySelector('main')?.dataset.selectedProject === " + JSON.stringify(destination.selected) : "document.querySelector('main')?.dataset.departmentProjects === " + JSON.stringify(name));
    await assertDepartmentDestination(name, false);
    await assertDepartmentLocked(name);
    await click('.project-page-nav .back'); await assertScreen('projects');
    await assertOverviewDepartmentCleared();
    const empty = Object.keys(content.departments).find(name => !projects.some(item => item.departments.includes(name)));
    if (empty) {
      await click('[data-department=' + JSON.stringify(empty) + ']');
      await assertDepartmentDestination(empty);
      assert.equal(await evaluate("!!document.querySelector('.gallery-empty')"), true);
      await click('.project-page-nav .back'); await assertScreen('projects');
      await assertOverviewDepartmentCleared();
    }
    const shared = Object.keys(content.departments).find(name => projects.filter(project => project.departments.includes(name)).length > 1);
    if (shared) {
      await click('[data-department=' + JSON.stringify(shared) + ']');
      await assertDepartmentDestination(shared);
      assert.equal(await evaluate("document.querySelectorAll('[data-project-link]').length"), 0);
      await assertDepartmentLocked(shared);
      const sharedProjects = getDepartmentProjects(projects, shared);
      assert.equal(await evaluate("document.querySelectorAll('[data-department-project-filter]').length"), 1, 'A department with multiple projects needs its own project filter.');
      const selectedProject = sharedProjects[0];
      await select('[data-department-project-filter]', selectedProject.id);
      assert.deepEqual(await evaluate("[...document.querySelectorAll('[data-project-detail]')].map(node=>node.dataset.projectDetail)"), [selectedProject.id]);
      assert.equal(await evaluate("document.querySelectorAll('.honduras-map').length"), 1);
      assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), selectedProject.entries.filter(entry => entry.departments.includes(shared)).reduce((count, entry) => count + entry.project.photos.length, 0));
      await click('.department-project-filter-clear');
      assert.deepEqual(await evaluate("[...document.querySelectorAll('[data-project-detail]')].map(node=>node.dataset.projectDetail).sort()"), sharedProjects.map(project => project.id).sort());
      await screenshot('department-projects-together-desktop');
      await viewport(390, 844);
      assert.equal(await evaluate("document.documentElement.scrollWidth>innerWidth"), false);
      await assertDepartmentLocked(shared, true);
      await screenshot('department-projects-together-mobile');
      await viewport(1366, 768);
      assert.equal(await evaluate("(()=>{const ids=[...document.querySelectorAll('[id]')].map(node=>node.id);return ids.length===new Set(ids).size;})()"), true);
      await click('.project-bottom-back');
      await assertOverviewDepartmentCleared();
      await evaluate('history.back()');
      await waitFor("document.querySelector('main')?.dataset.departmentProjects === " + JSON.stringify(shared));
      await assertDepartmentDestination(shared);
      await evaluate('history.back()');
      await waitFor("!!document.querySelector('.map-explorer-page')");
      await assertOverviewDepartmentCleared();
      await evaluate('history.forward()');
      await waitFor("document.querySelector('main')?.dataset.departmentProjects === " + JSON.stringify(shared));
      await assertDepartmentDestination(shared);
      await evaluate('history.forward()');
      await waitFor("!!document.querySelector('.map-explorer-page')");
      await assertOverviewDepartmentCleared();
    }
    // La página conjunta muestra todos los detalles sin elegir un proyecto.
    await evaluate("location.hash=" + JSON.stringify(getScreenHref({ view: 'department-projects', department: name })));
    await waitFor("document.querySelector('main')?.dataset.departmentProjects === " + JSON.stringify(name));
    await assertScreen('department-projects');
    await viewport(390, 844);
    assert.equal(await evaluate("document.documentElement.scrollWidth>innerWidth"), false);
    await screenshot('department-projects-mobile');
    await viewport(1366, 768);
    await screenshot('department-projects-desktop');
    const departmentProjects = getDepartmentProjects(projects, name);
    assert.equal(await evaluate("document.querySelectorAll('[data-project-link]').length"), 0);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('[data-project-detail]')].map(node=>node.dataset.projectDetail).sort()"), departmentProjects.map(project => project.id).sort());
    assert.equal(await evaluate("document.querySelectorAll('.honduras-map').length"), departmentProjects.length);
    assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), departmentProjects.reduce((count, project) => count + project.entries.filter(entry => entry.departments.includes(name)).reduce((total, entry) => total + entry.project.photos.length, 0), 0));
    assert.equal(await evaluate("(()=>{const ids=[...document.querySelectorAll('[id]')].map(node=>node.id);return ids.length===new Set(ids).size;})()"), true, 'Multiple project maps must have independent element IDs.');
    await assertDepartmentLocked(name);
    await click('.project-page-nav .back'); await assertScreen('projects');
    await assertOverviewDepartmentCleared();
    if (!desktop) {
      const tap = await evaluate("(()=>{const path=document.querySelector('.department.has-content .department-hit-area');const box=path.getBBox();for(let row=1;row<10;row++)for(let col=1;col<10;col++){const point=new DOMPoint(box.x+box.width*col/10,box.y+box.height*row/10);if(path.isPointInFill(point)){const screen=point.matrixTransform(path.getScreenCTM());return {x:screen.x,y:screen.y,name:path.closest('[data-department]').dataset.department}}}})()");
      assert.ok(tap);
      await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tap.x, y: tap.y });
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: tap.x, y: tap.y, button: 'left', clickCount: 1 });
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tap.x, y: tap.y, button: 'left', clickCount: 1 });
      await settle();
      await assertDepartmentDestination(tap.name);
      await click('.project-page-nav .back'); await assertScreen('projects');
      await assertOverviewDepartmentCleared();
    }
  }
  for (const [width, height] of [[1366, 768], [1024, 600], [820, 768], [390, 844], [320, 667]]) {
    await viewport(width, height);
    const layout = await evaluate("(()=>{const main=document.querySelector('.map-explorer-page').getBoundingClientRect();const map=document.querySelector('.honduras-map').getBoundingClientRect();const panel=document.querySelector('.map-project-panel').getBoundingClientRect();return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,pageHeight:main.height,mapWidth:map.width,mapHeight:map.height,panelTop:panel.top,panelBottom:panel.bottom};})()");
    assert.equal(layout.overflow, false, 'Overview overflows at ' + width);
    assert.ok(layout.pageHeight >= height * .97, 'The general map should fill the viewport.');
    assert.ok(layout.mapWidth >= width * (width > 760 ? .6 : .85), 'The map should remain the dominant area.');
    assert.ok(layout.mapHeight > 250, 'The map needs enough room at every screen size.');
    assert.ok(layout.panelTop >= -1 && layout.panelBottom <= height + 1, 'Filters should remain within the viewport.');
    layouts.push(layout);
  }
  // Los avisos de media query pueden esperar un fotograma en Electron oculto.
  // El plegado automático se verifica en web; el botón se comprueba en ambos.
  if (!desktop) assert.equal(await evaluate("document.querySelector('#overview-project-results').hidden"), true);
  if (await evaluate("!document.querySelector('#overview-project-results').hidden")) await click('.overview-results-toggle');
  await viewport(390, 844);
  await screenshot('general-map-mobile');
  await click('.overview-results-toggle');
  assert.equal(await evaluate("document.querySelector('#overview-project-results').hidden"), false);
  await screenshot('general-map-mobile-projects');
  await viewport(1366, 768); await evaluate('window.scrollTo(0,0)'); await screenshot('general-map-desktop');
  for (const project of projects) {
    await click('[data-project-link="' + project.id + '"]'); await assertScreen('map', project.id);
    assert.equal(await evaluate("document.querySelector('#page-title').textContent"), project.name);
    assert.equal(await evaluate("document.activeElement.id"), 'main-content');
    assert.equal(await evaluate("document.querySelectorAll('.honduras-map .department').length"), 18);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.is-project-location')].map(node=>node.dataset.department).sort()"), [...project.departments].sort());
    assert.equal(await evaluate("document.querySelectorAll('.department[tabindex=\"0\"]').length"), project.departments.length);
    assert.equal(await evaluate("document.querySelectorAll('.honduras-map image').length"), project.departments.filter(name => content.mapThumbnails.detail[name]).length, 'Detail thumbnails must come only from the detail set.');
    assert.equal(await evaluate("document.querySelectorAll('.project-section').length"), project.entries.length);
    assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), project.photos.length);
    assert.equal(await evaluate("document.querySelectorAll('.project-activities li').length"), project.activityCount);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.photo-description')].map(node=>node.textContent)"), project.entries.flatMap(entry => entry.project.photos).filter(photo => photo.description).map(photo => photo.description));
    await evaluate("Promise.all([...document.querySelectorAll('.gallery-img img')].map(img=>{img.loading='eager';return img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})})}))");
    assert.equal(await evaluate("[...document.querySelectorAll('.gallery-img img')].every(img=>img.naturalWidth>0)"), true);
    await press('ArrowRight'); await assertScreen('map', project.id);
    await reload("document.querySelector('main')?.dataset.selectedProject === " + JSON.stringify(project.id));
    await assertScreen('map', project.id);
    for (const name of project.departments) {
      const expected = project.entries.filter(entry => entry.departments.includes(name));
      await click('[data-department=' + JSON.stringify(name) + ']');
      assert.equal(await evaluate("document.querySelectorAll('.project-section').length"), expected.length);
      assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), expected.reduce((count, entry) => count + entry.project.photos.length, 0));
      assert.equal(await evaluate("document.querySelector('.department.is-selected')?.dataset.department"), name);
      await evaluate("location.hash=" + JSON.stringify(getScreenHref({ view: 'map', selected: project.id })));
      await waitFor("document.querySelector('main')?.dataset.selectedProject === " + JSON.stringify(project.id) + " && !document.querySelector('.department.is-selected')");
      assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), project.photos.length);
      assert.equal(await evaluate("document.querySelectorAll('.department.is-selected').length"), 0);
    }
    await viewport(390, 844);
    assert.equal(await evaluate("[...document.querySelectorAll('.detail-information')].every(node=>getComputedStyle(node).display!=='none')"), true, 'Activities should initially be visible on mobile.');
    await click('.information-toggle');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.detail-information')).display"), 'none');
    await click('.information-toggle');
    for (const [width, height] of [[1366, 768], [1024, 600], [820, 768], [390, 844], [320, 667]]) {
      await viewport(width, height);
      assert.equal(await evaluate("document.documentElement.scrollWidth > innerWidth"), false, project.name + ' overflows at ' + width);
      assert.equal(await evaluate("[...document.querySelectorAll('.photo-description')].every(node=>node.scrollHeight<=node.clientHeight+1)"), true, 'Descriptions are clipped.');
      const mapHeight = await evaluate("document.querySelector('.map-panel').getBoundingClientRect().height");
      assert.ok(mapHeight > 300, 'The map must remain usable on each screen size.');
    }
    await viewport(1366, 768); await evaluate('window.scrollTo(0,0)'); await screenshot('project-map-' + project.id);
    await evaluate("document.querySelector('.project-evidence').scrollIntoView({block:'start'})"); await screenshot('project-activities-' + project.id);
    await viewport(390, 844); await evaluate("document.querySelector('.project-evidence').scrollIntoView({block:'start'})"); await screenshot('project-mobile-' + project.id);
    await viewport(1366, 768);
    if (PHOTO_VIEWER_ENABLED) {
      await click('.gallery-img'); await waitFor("document.querySelector('.viewer-stage img')?.naturalWidth > 0");
      await press('ArrowRight'); await assertScreen('map', project.id);
      await press('Escape');
      assert.equal(await evaluate("!document.querySelector('main').inert"), true);
    } else {
      assert.equal(await evaluate("document.querySelectorAll('button.gallery-img, .photo-zoom').length"), 0);
      await click('.gallery-img'); await assertScreen('map', project.id);
    }
    await click('.project-page-nav .back'); await assertScreen('projects');
    await evaluate('history.back()'); await waitFor("document.querySelector('main')?.dataset.selectedProject === " + JSON.stringify(project.id));
    await assertScreen('map', project.id);
    await evaluate('history.forward()'); await waitFor("!!document.querySelector('.projectsview')");
    await assertOverviewDepartmentCleared();
  }

  let mapPinchZoom = desktop ? null : false;
  if (projects.length) {
    const project = projects[0];
    await click('[data-project-link="' + project.id + '"]'); await assertScreen('map', project.id);
    await viewport(1366, 768); await evaluate("document.querySelector('.map-panel').scrollIntoView({block:'center'})");
    const original = await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')");
    await click('[aria-label="Ampliar mapa"]');
    const zoomed = await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')");
    assert.notEqual(zoomed, original);
    const point = await evaluate("(()=>{const box=document.querySelector('.honduras-map').getBoundingClientRect();return {x:box.x+box.width*.6,y:box.y+box.height*.6};})()");
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x - 60, y: point.y, button: 'left', buttons: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x - 60, y: point.y, button: 'left', clickCount: 1 });
    await settle(); await assertScreen('map', project.id);
    assert.notEqual(await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')"), zoomed);
    assert.equal(await evaluate("document.querySelectorAll('.project-section').length"), project.entries.length, 'Dragging should not select a territory.');
    await click('[aria-label="Mostrar todo Honduras"]');
    // El clic físico se comprueba en web; Electron oculto no actualiza de forma
    // fiable su superficie de hit testing después de desplazar el documento.
    if (!desktop) {
      const tap = await evaluate("(()=>{const path=document.querySelector('.is-project-location .department-hit-area');const box=path.getBBox();for(let row=1;row<10;row++)for(let col=1;col<10;col++){const point=new DOMPoint(box.x+box.width*col/10,box.y+box.height*row/10);if(path.isPointInFill(point)){const screen=point.matrixTransform(path.getScreenCTM());return {x:screen.x,y:screen.y,name:path.closest('[data-department]').dataset.department}}}})()");
      assert.ok(tap, 'An active department should have a selectable area.');
      await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: tap.x, y: tap.y });
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: tap.x, y: tap.y, button: 'left', clickCount: 1 });
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tap.x, y: tap.y, button: 'left', clickCount: 1 });
      await settle();
      assert.equal(await evaluate("document.querySelector('.department.is-selected')?.dataset.department"), tap.name, 'Mouse selection should show the chosen territory.');
      await evaluate("location.hash=" + JSON.stringify(getScreenHref({ view: 'map', selected: project.id })));
      await waitFor("!document.querySelector('.department.is-selected')");
    }
    for (const key of ['Enter', ' ']) {
      await focus('.is-project-location'); await press(key);
      assert.equal(await evaluate("!!document.querySelector('.department.is-selected')"), true, 'Keyboard selection failed: ' + key);
      assert.equal(await evaluate("document.activeElement === document.querySelector('.project-evidence')"), true, 'Selecting a department must focus its activities and photographs.');
      await click('.project-evidence-heading .back');
    }
    if (!desktop) {
      await viewport(390, 844); await evaluate("document.querySelector('.map-panel').scrollIntoView({block:'center'})");
      const pinch = await evaluate("(()=>{const box=document.querySelector('.honduras-map').getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2};})()");
      await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: pinch.x - 35, y: pinch.y }, { id: 2, x: pinch.x + 35, y: pinch.y }] });
      await command('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: pinch.x - 65, y: pinch.y }, { id: 2, x: pinch.x + 65, y: pinch.y }] });
      await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await settle();
      assert.notEqual(await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')"), original);
      mapPinchZoom = true;
    }
    await click('[aria-label="Mostrar todo Honduras"]'); await screenshot('project-map-mobile');
    await click('.is-project-location');
    assert.equal(await evaluate("!!document.querySelector('.department.is-selected')"), true);
    await focus('#main-content'); await press('ArrowLeft'); await assertScreen('projects');
    await assertOverviewDepartmentCleared();
    await evaluate("location.hash='#/proyectos/no-existe/mapa'"); await settle(); await assertScreen('projects');
    await click('.map-project-result');
    await evaluate("document.querySelector('.gallery-img img').dispatchEvent(new Event('error'))"); await settle();
    assert.equal(await evaluate("!!document.querySelector('.gallery-img .photo-placeholder') && !!document.querySelector('.gallery-img .photo-description')"), true);
  }
  await click('.global-footer button');
  assert.equal(await evaluate("document.querySelector('.help-modal').textContent.includes('Ver proyectos')"), true);
  await press('Escape');
  assert.equal(await evaluate("document.querySelector('main').inert"), false);
  assert.deepEqual(remoteRequests, [], 'Unexpected remote requests.');
  assert.deepEqual(exceptions, [], 'JavaScript exceptions.');
  assert.deepEqual(errors, [], 'Console errors.');
  const report = { mode: desktop ? 'desktop' : 'web', offline: desktop, projects: projects.length, photographs: projects.reduce((count, project) => count + project.photos.length, 0), layouts, fullViewportMap: true, projectFilters: true, preservedOverviewFilters: true, departmentClickNavigation: true, departmentProjectsTogether: true, mobileResultsAutoCollapse: desktop ? null : true, projectGeographicCoverage: true, territoryScopedEvidence: true, descriptionsVisible: true, directProjectLinks: true, browserHistory: true, keyboardFocus: true, bundledContentIgnoresOldLocalEdits: true, mouseMapSelection: desktop ? null : true, mapPinchZoom, photoViewerEnabled: PHOTO_VIEWER_ENABLED, remoteImageRequests, remoteRequests, exceptions, screenshots: desktop ? null : work };
  await writeFile(path.join(desktop ? path.join(root, 'release') : work, desktop ? 'verificacion-sin-conexion.json' : 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('General map, project filters, preserved detail maps, activities, images and navigation passed.');
  console.log(JSON.stringify(report, null, 2));
  await send('Browser.close').catch(() => {});
} catch (error) {
  await captureFailure?.().catch(() => {});
  throw error;
} finally {
  await closeBrowser?.().catch(() => {});
  for (const call of pending.values()) clearTimeout(call.timer);
  ws?.close(); browser?.kill(); await server?.close(); clearInterval(keepAlive);
}
