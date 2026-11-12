import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeContent } from '../src/content.js';
import { PHOTO_VIEWER_ENABLED } from '../src/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const desktop = process.argv.includes('--desktop');
const work = await mkdtemp(path.join(tmpdir(), 'asonog-ui-'));
const profile = path.join(work, 'profile');
let server, browser, ws, browserError, captureFailure, closeBrowser;
let stderr = '';
const pending = new Map();
const keepAlive = setInterval(() => {}, 1000);
try {
  const executable = desktop ? path.resolve(root, process.argv.slice(2).find(argument => /\.exe$/i.test(argument)) || 'release/ASONOG-Nuestra-Labor-2026-Portable.exe') : process.env.ASONOG_TEST_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  await access(executable);
  let origin;
  if (!desktop) {
    const { createServer } = await import('vite');
    server = await createServer({ root, server: { host: '127.0.0.1', port: 0 } });
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
  const input = async (selector, value) => {
    await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); const setter = Object.getOwnPropertyDescriptor(element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; setter.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event('input', {bubbles:true})); })()`);
    await settle();
  };
  const press = async (key, options = {}) => {
    const codes = { ArrowLeft: 37, ArrowRight: 39, Escape: 27 };
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: codes[key], ...options });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: codes[key], modifiers: options.modifiers || 0 });
    await settle();
  };
  const focus = selector => evaluate('document.querySelector(' + JSON.stringify(selector) + ').focus({ preventScroll: true })');
  const assertScreen = async (view, selected) => {
    const screen = await evaluate("(() => { const main = document.querySelector('main'); return { view: main.classList.contains('cover') ? 'cover' : main.classList.contains('mapview') ? 'map' : 'detail', selected: main.classList.contains('detailview') ? document.querySelector('#page-title')?.textContent || null : null }; })()");
    assert.deepEqual(screen, { view, selected: selected || null });
  };
  const viewport = async (width, height) => { await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 641 }); await settle(); };
  const reload = async () => {
    await evaluate("document.documentElement.dataset.checkReload = 'pending'");
    await command('Page.reload');
    await waitFor("document.documentElement.dataset.checkReload !== 'pending' && document.querySelectorAll('.preview-department').length === 18 && !!document.querySelector('.cover-copy > p')");
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

  const documented = Object.entries(content.departments).filter(([, department]) => department.demo || department.verified);
  // Arrows connect the main pages; selecting the map is the only entry to details.
  await focus('.topbar .iconbutton'); await press('ArrowRight'); await assertScreen('map');
  await focus('.map-zoom button'); await press('ArrowRight'); await assertScreen('cover');
  await focus('.global-footer .map-credit a'); await press('ArrowLeft'); await assertScreen('map');
  await press('ArrowRight', { autoRepeat: true }); await assertScreen('map');
  await press('ArrowRight', { modifiers: 2 }); await assertScreen('map');
  await focus('.map-labels input'); await press('ArrowLeft'); await assertScreen('map');
  await focus('#main-content');
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowRight', 'ArrowLeft']) {
    await press(key); await assertScreen('cover');
    await press(key); await assertScreen('map');
  }
  for (const [name] of documented) {
    await click('[aria-label="Abrir ' + name + '"]'); await assertScreen('detail', name);
    assert.equal(await evaluate("document.activeElement.id === 'main-content'"), true);
    const photosBefore = await evaluate("document.querySelectorAll('.gallery-img').length");
    await press('ArrowRight'); await assertScreen('detail', name);
    await focus('.back'); await press('ArrowRight'); await assertScreen('detail', name);
    assert.equal(await evaluate("document.activeElement.classList.contains('back')"), true);
    assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), photosBefore);
    await viewport(390, 844);
    await click('.information-toggle'); await press('ArrowRight'); await assertScreen('detail', name);
    assert.equal(await evaluate("document.querySelector('.information-toggle').getAttribute('aria-expanded')"), 'true');
    await viewport(1366, 768);
    await click('.global-footer button'); await press('ArrowRight'); await assertScreen('detail', name);
    assert.equal(await evaluate("!!document.querySelector('.help-modal')"), true);
    await press('ArrowLeft'); await assertScreen('map');
    assert.equal(await evaluate("!document.querySelector('.help-modal') && !document.querySelector('main').inert"), true);
    await press('ArrowLeft'); await assertScreen('cover');
    await press('ArrowLeft'); await assertScreen('map');
  }
  await click('.global-footer button'); await press('ArrowRight'); await assertScreen('cover');
  assert.equal(await evaluate("!document.querySelector('.help-modal') && !document.querySelector('main').inert"), true);
  await click('.global-footer button'); await press('ArrowLeft'); await assertScreen('map');
  const hasSearch = await evaluate("!!document.querySelector('[aria-label=\"Buscar departamento\"]')");
  const hasMapFilters = await evaluate("!!document.querySelector('.map-filters')");
  if (hasSearch) {
    await input('[aria-label="Buscar departamento"]', 'Departamento inexistente');
    await focus('[aria-label="Buscar departamento"]');
    await evaluate("document.querySelector('[aria-label=\"Buscar departamento\"]').setSelectionRange(4, 4)");
    await press('ArrowLeft'); await assertScreen('map');
    assert.equal(await evaluate("document.querySelector('[aria-label=\"Buscar departamento\"]').selectionStart"), 3);
    await focus('#main-content'); await press('ArrowRight'); await assertScreen('cover');
    await press('ArrowLeft'); await assertScreen('map');
    assert.equal(await evaluate("!!document.querySelector('.map-empty')"), true);
    await click('.map-empty .clear-filters');
  }
  await focus('#main-content');
  await press('ArrowLeft'); await assertScreen('cover');
  console.log('Arrows only connect home/map; details require map selection, ignore Right and return with Left. Focus and expanded information are preserved.');
  const allPhotos = documented.flatMap(([, department]) => department.photos || []);
  for (const photo of allPhotos) for (const src of [photo.src, photo.thumbnail].filter(Boolean)) {
    if (src.startsWith('/assets/')) {
      assert.equal(await evaluate(`fetch(${JSON.stringify(src)}).then(response=>response.ok)`), true);
    } else {
      assert.ok(src.startsWith('data:image/') || (!desktop && /^https?:\/\//i.test(src)), 'Desktop images must be local: ' + src);
    }
  }
  console.log('Bundled map, fonts, original photographs and thumbnails available.');
  await click('.map-preview-open');
  await waitFor("document.querySelectorAll('.honduras-map .department').length===18");
  assert.equal(await evaluate("document.querySelector('.map-panel [aria-label=\"Vista del mapa\"]') === null"), true, 'The interactive map must display photographs without a view selector.');
  assert.equal(await evaluate("document.querySelectorAll('.honduras-map image[clip-path]').length"), documented.filter(([, department]) => department.photos?.length).length);
  const layouts = [];
  for (const [width, height] of [[1366, 768], [1024, 600], [820, 768], [390, 844], [375, 667]]) {
    await viewport(width, height);
    const layout = await evaluate(`({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,mapTop:document.querySelector('.map-panel').getBoundingClientRect().top,mapBottom:document.querySelector('.map-panel').getBoundingClientRect().bottom})`);
    assert.equal(layout.overflow, false, JSON.stringify(layout));
    assert.ok(layout.mapBottom > layout.mapTop, 'Map must have a positive height: ' + JSON.stringify(layout));
    layouts.push(layout);
  }
  await screenshot('map-mobile');
  await viewport(1366, 768);
  const originalViewBox = await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')");
  await click('[aria-label="Ampliar mapa"]');
  assert.notEqual(await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')"), originalViewBox);
  const beforeDrag = await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')");
  // Dragging changes the camera without opening a department.
  const point = await evaluate("(()=>{const box=document.querySelector('.honduras-map').getBoundingClientRect();return {x:box.x+box.width*.6,y:box.y+box.height*.6};})()");
  await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
  await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x - 60, y: point.y, button: 'left', buttons: 1 });
  await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x - 60, y: point.y, button: 'left', clickCount: 1 });
  await settle(); assert.equal(await evaluate("!!document.querySelector('.honduras-map')"), true);
  assert.notEqual(await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')"), beforeDrag, 'Map drag did not move camera.');
  await click('[aria-label="Mostrar todo Honduras"]');
  assert.equal(await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')"), originalViewBox);
  await viewport(390, 844);
  const mapPinch = await evaluate("(()=>{const box=document.querySelector('.honduras-map').getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2};})()");
  await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: mapPinch.x - 35, y: mapPinch.y }, { id: 2, x: mapPinch.x + 35, y: mapPinch.y }] });
  await command('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: mapPinch.x - 65, y: mapPinch.y }, { id: 2, x: mapPinch.x + 65, y: mapPinch.y }] });
  await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle();
  assert.notEqual(await evaluate("document.querySelector('.honduras-map').getAttribute('viewBox')"), originalViewBox, 'Map pinch did not zoom.');
  await click('[aria-label="Mostrar todo Honduras"]'); await viewport(1366, 768);
  if (hasSearch) {
    await input('[aria-label="Buscar departamento"]', 'Intibuca');
    assert.equal(await evaluate("document.querySelectorAll('.dept-list button').length"), 1);
    await input('[aria-label="Buscar departamento"]', '');
    await click('.only-content input');
    assert.equal(await evaluate("document.querySelectorAll('.dept-list button').length"), documented.length);
    await click('.only-content input');
  }
  await waitFor("document.querySelectorAll('.honduras-map image').length===" + documented.filter(([, department]) => department.photos?.length).length);
  await screenshot('map-desktop');
  const emptyDepartment = await evaluate("document.querySelector('.department:not(.has-content)')?.getAttribute('aria-label')");
  if (emptyDepartment) {
    await click('[aria-label=' + JSON.stringify(emptyDepartment) + ']');
    assert.equal(await evaluate("!!document.querySelector('.map-preview-card')"), true);
    await click('[aria-label="Cerrar ficha del mapa"]');
  }
  const [firstName, firstDepartment] = documented[0];
  const firstCount = firstDepartment.projects[0].photos.length;
  const featuredPhoto = firstDepartment.projects[0].photos[0];
  const thumbnailIndex = Math.min(4, firstCount);
  await click('[aria-label="Abrir ' + firstName + '"]');
  await waitFor("document.querySelectorAll('.gallery-img').length===" + firstDepartment.photos.length + " && document.querySelector('.gallery-img img')?.complete");
  const groupedProjects = await evaluate("[...document.querySelectorAll('.project-section')].map(section => ({name:section.querySelector('.project-heading h3').textContent,activities:section.querySelectorAll('.project-activities li').length,achievements:section.querySelectorAll('.project-achievements li').length,photos:section.querySelectorAll('.gallery-img').length,communities:[...section.querySelectorAll('.project-communities li')].map(item=>item.textContent)}))");
  assert.deepEqual(groupedProjects, firstDepartment.projects.map(project => ({name:project.name,activities:4,achievements:2,photos:6,communities:project.communities})));
  for (const [width, height] of [[1366,768], [1024,600], [820,768], [390,844], [375,667]]) {
    await viewport(width, height);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false, `Project detail overflows at ${width}px.`);
  }
  await viewport(1366,768);
  const caption = await evaluate("(()=>{const photo=document.querySelector('.gallery-img');return {image:photo.querySelector('.photo-frame').getBoundingClientRect().bottom,caption:photo.querySelector('.photo-caption').getBoundingClientRect().top};})()");
  assert.ok(caption.caption >= caption.image - 1, 'Caption overlaps image.');
  await screenshot('gallery-desktop');
  const descriptions = firstDepartment.projects.flatMap(project => project.photos).filter(photo => photo.description).map(photo => photo.description);
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.photo-description')].map(element=>element.textContent)"), descriptions);
  assert.equal(await evaluate("[...document.querySelectorAll('.photo-description')].every(element=>element.scrollHeight<=element.clientHeight+1)"), true, 'Photo descriptions are clipped.');
  if (PHOTO_VIEWER_ENABLED) {
  await click('.gallery-img');
  await waitFor("document.querySelector('.viewer-stage img')?.naturalWidth > 0");
  assert.equal(await evaluate("!!document.activeElement.closest('.lightbox') && document.querySelector('main').inert && document.body.style.overflow==='hidden'"), true);
  assert.equal(await evaluate("document.querySelector('.viewer-stage img').getAttribute('src')"), featuredPhoto.src, 'The viewer must use the original image URL.');
  await press('ArrowRight'); await assertScreen('detail', firstName);
  assert.equal(await evaluate("document.querySelector('.viewer-metadata small').textContent.trim()"), Math.min(2, firstCount) + ' / ' + firstCount);
  await press('ArrowLeft');
  assert.equal(await evaluate("document.querySelector('.viewer-metadata small').textContent.trim()"), '1 / ' + firstCount);
  await press('ArrowRight', { modifiers: 2 });
  assert.equal(await evaluate("document.querySelector('.viewer-metadata small').textContent.trim()"), '1 / ' + firstCount);
  await click('[aria-label="Ampliar fotografía"]');
  assert.equal(await evaluate("document.querySelector('.zoom-value').textContent.includes('150%')"), true);
  if (firstCount > 1) await click('[aria-label="Fotografía siguiente"]');
  assert.equal(await evaluate("document.querySelector('.viewer-metadata small').textContent.trim()"), Math.min(2, firstCount) + ' / ' + firstCount);
  await click('[aria-label="Ver fotografía ' + thumbnailIndex + '"]');
  assert.equal(await evaluate("document.querySelector('.viewer-metadata small').textContent.trim()"), thumbnailIndex + ' / ' + firstCount);
  await screenshot('viewer-desktop');
  // Tab loops back into the dialog and Escape restores the original gallery button.
  await evaluate("[...document.querySelectorAll('.viewer-thumbnails button')].at(-1).focus()");
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  assert.equal(await evaluate("!!document.activeElement.closest('.lightbox')"), true);
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await settle();
  assert.equal(await evaluate("document.activeElement.classList.contains('gallery-img') && !document.querySelector('main').inert && document.body.style.overflow!== 'hidden'"), true);
  } else {
    assert.equal(await evaluate("document.querySelectorAll('button.gallery-img, .gallery-img[role=\"button\"], .photo-zoom').length"), 0);
    assert.equal(await evaluate("[...document.querySelectorAll('.gallery-img')].every(element=>element.tagName==='FIGURE' && !!element.querySelector('figcaption'))"), true);
    await click('.gallery-img'); await assertScreen('detail', firstName);
    assert.equal(await evaluate("!document.querySelector('.lightbox') && !document.querySelector('main').inert && document.body.style.overflow!=='hidden'"), true);
  }
  await viewport(390, 844); await evaluate('window.scrollTo(0,0)');
  assert.equal(await evaluate("document.documentElement.scrollWidth>innerWidth"), false);
  assert.ok(await evaluate("document.querySelector('.project-heading').getBoundingClientRect().top < innerHeight"));
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.detail-information')).display"), 'none');
  await click('.information-toggle'); assert.notEqual(await evaluate("getComputedStyle(document.querySelector('.detail-information')).display"), 'none');
  await click('.information-toggle');
  await evaluate("document.querySelector('.project-heading').scrollIntoView({block:'start'})");
  await screenshot('detail-mobile');
  assert.equal(await evaluate("[...document.querySelectorAll('.photo-description')].every(element=>element.scrollHeight<=element.clientHeight+1)"), true);
  if (PHOTO_VIEWER_ENABLED) {
  await click('.gallery-img'); await screenshot('viewer-mobile');
  const swipe = await evaluate("(()=>{const r=document.querySelector('.viewer-stage').getBoundingClientRect();return {x:r.x+r.width*.7,y:r.y+r.height*.5};})()");
  await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: swipe.x - 70, y: swipe.y }, { id: 2, x: swipe.x, y: swipe.y }] });
  await command('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: swipe.x - 110, y: swipe.y }, { id: 2, x: swipe.x + 30, y: swipe.y }] });
  await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(); assert.notEqual(await evaluate("document.querySelector('.zoom-value').textContent.trim()"), '100%', 'Photo pinch did not zoom.');
  await click('[aria-label="Restablecer fotografía"]');
  await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: swipe.x, y: swipe.y }] });
  await command('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: swipe.x - 100, y: swipe.y }] });
  await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settle(); assert.equal(await evaluate("document.querySelector('.viewer-metadata small').textContent.trim()"), Math.min(2, firstCount) + ' / ' + firstCount);
  await click('[aria-label="Cerrar fotografía"]');
  } else {
    await click('.gallery-img'); await assertScreen('detail', firstName);
    assert.equal(await evaluate("document.querySelector('.lightbox')===null"), true);
    await evaluate("document.querySelector('.gallery-img img').dispatchEvent(new Event('error'))"); await settle();
    assert.equal(await evaluate("!!document.querySelector('.gallery-img .photo-placeholder') && !!document.querySelector('.gallery-img .photo-description')"), true, 'A missing image must retain its description.');
  }
  await click('.back'); await viewport(1366, 768);
  console.log('Responsive layout, map gestures, inline photo descriptions, keyboard focus and current gallery interaction passed.');

  const multiple = documented.find(([, department]) => department.projects.length > 1);
  if (multiple) {
    await click('[aria-label="Abrir ' + multiple[0] + '"]');
    assert.equal(await evaluate("document.querySelectorAll('.project-section').length"), multiple[1].projects.length);
    const second = multiple[1].projects[1];
    if (PHOTO_VIEWER_ENABLED) {
    await click('.project-section:nth-child(2) .gallery-img:last-child');
    assert.equal(await evaluate("document.querySelector('.viewer-metadata small').textContent.trim()"), '6 / 6');
    assert.equal(await evaluate("document.querySelector('.viewer-tags span').textContent"), second.name);
    await press('ArrowRight');
    assert.equal(await evaluate("document.querySelector('.viewer-metadata small').textContent.trim()"), '1 / 6');
    assert.equal(await evaluate("document.querySelector('.viewer-tags span').textContent"), second.name);
    await press('Escape');
    } else {
      assert.deepEqual(await evaluate("[...document.querySelectorAll('.project-section:nth-child(2) .photo-description')].map(element=>element.textContent)"), second.photos.filter(photo=>photo.description).map(photo=>photo.description));
      await click('.project-section:nth-child(2) .gallery-img:last-child');
      assert.equal(await evaluate("document.querySelector('.lightbox')===null"), true);
    }
    if (await evaluate("!!document.querySelector('[aria-label=\"Proyecto\"]')")) {
      await select('[aria-label="Proyecto"]', second.name);
      assert.equal(await evaluate("document.querySelectorAll('.project-section').length"), 1);
      assert.equal(await evaluate("document.querySelector('.project-heading h3').textContent"), second.name);
      assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), 6);
      const community = second.communities[1] || second.communities[0];
      await select('[aria-label="Comunidad"]', community);
      assert.equal(await evaluate("document.querySelectorAll('.project-section').length"), 1);
      assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), second.photos.filter(photo=>photo.community===community).length);
      await click('.clear-filters');
      assert.equal(await evaluate("document.querySelectorAll('.project-section').length"), multiple[1].projects.length);
    }
    await viewport(390,844);
    await click('.project-section:first-child .information-toggle');
    assert.notEqual(await evaluate("getComputedStyle(document.querySelector('.project-section:first-child .detail-information')).display"), 'none');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.project-section:nth-child(2) .detail-information')).display"), 'none');
    await viewport(1366,768); await evaluate("document.querySelector('.project-heading').scrollIntoView({block:'start'})");
    await screenshot('projects-desktop');
    await click('.back');
  }
  console.log('Projects keep their activities, communities, achievements, photographs and descriptions together.');

  const filterable = documented.find(([, department]) => department.photos?.some(photo => photo.project && photo.axis));
  const checkedMapFilters = Boolean(filterable && hasMapFilters && hasSearch);
  if (checkedMapFilters) {
    const target = filterable[1].photos.find(photo => photo.project && photo.axis);
    await select('.map-filters label:first-child select', target.project);
    await select('.map-filters label:nth-child(2) select', target.axis);
    const expectedNames = documented.filter(([, department]) => department.photos?.some(photo => photo.project === target.project && photo.axis === target.axis)).map(([name]) => name).sort((a, b) => a.localeCompare(b, 'es'));
    assert.deepEqual(await evaluate("[...document.querySelectorAll('.dept-list strong')].map(element => element.textContent)"), expectedNames);
    for (const name of expectedNames) {
      const matchingPhotos = content.departments[name].photos.filter(photo => photo.project === target.project && photo.axis === target.axis);
      const expectedPhoto = matchingPhotos.find(photo => photo.featured) || matchingPhotos[0];
      const selector = '[data-department=' + JSON.stringify(name) + '] image';
      assert.equal(await evaluate('document.querySelector(' + JSON.stringify(selector) + ').getAttribute("href")'), expectedPhoto.thumbnail || expectedPhoto.src);
    }
    await click('[aria-label="Abrir ' + expectedNames[0] + '"]');
    await assertScreen('detail', expectedNames[0]);
    const matchingPhotos = content.departments[expectedNames[0]].photos.filter(photo => photo.project === target.project && photo.axis === target.axis);
    assert.equal(await evaluate("document.querySelectorAll('.gallery-img').length"), matchingPhotos.length);
    if (await evaluate("!!document.querySelector('[aria-label=\"Proyecto\"]')")) {
      assert.equal(await evaluate("document.querySelector('[aria-label=\"Proyecto\"]').value"), target.project);
      assert.equal(await evaluate("document.querySelector('[aria-label=\"Eje de intervención\"]').value"), target.axis);
    }
    await press('ArrowLeft'); await assertScreen('map');
    assert.equal(await evaluate("document.querySelector('.map-filters label:first-child select').value"), target.project);
    assert.equal(await evaluate("document.querySelector('.map-filters label:nth-child(2) select').value"), target.axis);
    await input('[aria-label="Buscar departamento"]', 'Departamento inexistente');
    assert.equal(await evaluate("!!document.querySelector('.map-empty')"), true);
    assert.equal(await evaluate("document.querySelectorAll('.honduras-map image').length"), 0);
    await click('.map-empty .clear-filters');
  }
  const published = Object.values(content.departments).filter(department => department.verified && !department.demo);
  if (await evaluate("!!document.querySelector('.metric strong')")) {
    assert.equal(await evaluate("document.querySelector('.metric strong').textContent"), String(published.length));
  }
  await click('.global-footer button');
  assert.equal(await evaluate("document.querySelector('.help-modal').textContent.includes('Administración')"), false);
  await click('.modal-head > button');
  assert.equal(await evaluate("document.querySelector('.admin-trigger, .admin-modal, [aria-label=\"Editar contenido\"], input[type=\"file\"], form, textarea') === null"), true);
  assert.deepEqual(remoteRequests, [], 'Unexpected remote requests.');
  assert.deepEqual(exceptions, [], 'JavaScript exceptions.');
  assert.deepEqual(errors, [], 'Console errors.');
  const report = { mode: desktop ? 'desktop' : 'web', executable: desktop ? executable : undefined, offline: desktop, photographs: allPhotos.length, layouts, presentationOnly: true, bundledContentIgnoresOldLocalEdits: true, projectGrouping: true, photoDescriptionsOnPage: true, photoViewerEnabled: PHOTO_VIEWER_ENABLED, projectScopedViewer: PHOTO_VIEWER_ENABLED ? true : null, independentProjectInformation: true, combinedFilters: checkedMapFilters ? true : null, mapPhotoMatchesFilters: checkedMapFilters ? true : null, searchChecked: hasSearch, keyboardFocus: true, mainPageArrowNavigation: true, detailOnlyReturnsToMap: true, mapSelectionRequiredForDepartments: true, arrowNavigationFromFocusedControls: true, touchSwipe: PHOTO_VIEWER_ENABLED ? true : null, mapPinchZoom: true, photoPinchZoom: PHOTO_VIEWER_ENABLED ? true : null, remoteImageRequests, remoteRequests, exceptions, screenshots: desktop ? null : work };
  await writeFile(path.join(desktop ? path.join(root, 'release') : work, desktop ? 'verificacion-sin-conexion.json' : 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Presentation-only interface, bundled content and map-only access to department details passed.');
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
