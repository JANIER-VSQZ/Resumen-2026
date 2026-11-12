import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execute = promisify(execFile);

async function fixture(t, photoOverrides = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'asonog-offline-test-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()));
    assert.match(path.basename(root), /^asonog-offline-test-/);
    await rm(root, { recursive: true, force: true });
  });
  const project = {
    id: 'manual', name: 'Proyecto manual', communities: ['A'],
    activities: ['Actividad 1', 'Actividad 2', 'Actividad 3', 'Actividad 4'],
    achievements: ['Logro 1', 'Logro 2'],
    photos: Array.from({ length: 6 }, () => ({
      src: '/assets/manual.jpg', thumbnail: '/assets/manual.jpg', community: 'A',
      ...photoOverrides,
    })),
  };
  const original = JSON.stringify({ departments: { Lempira: { demo: true, projects: [project] } } }, null, '\t').replaceAll('\n', '\r\n') + '\r\n';
  const manifest = '{ "original": true }\n';
  const files = {
    'package.json': '{ "type": "module" }',
    'src/content.json': original,
    'src/content.js': await readFile(new URL('../src/content.js', import.meta.url)),
    'scripts/prepare-offline.mjs': await readFile(new URL('./prepare-offline.mjs', import.meta.url)),
    'src/assets/honduras-departments.source.json': '{ "fixture": true }',
    'public/assets/manual.jpg': Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
    'public/assets/offline/sources.json': manifest,
    'deny-network.mjs': 'globalThis.fetch = () => { throw new Error("UNEXPECTED_NETWORK_REQUEST"); };\n',
  };
  for (const family of ['dm-sans', 'manrope']) {
    const directory = `node_modules/@fontsource-variable/${family}`;
    files[directory + '/LICENSE'] = 'Local license';
    files[directory + `/files/${family}-latin-wght-normal.woff2`] = 'Local font';
  }
  for (const [file, value] of Object.entries(files)) {
    const target = path.join(root, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, value);
  }
  const run = () => execute(process.execPath, [
    '--import', pathToFileURL(path.join(root, 'deny-network.mjs')).href,
    path.join(root, 'scripts', 'prepare-offline.mjs'),
  ], { cwd: root, windowsHide: true });
  const assertPreserved = async () => {
    assert.equal(await readFile(path.join(root, 'src/content.json'), 'utf8'), original);
    assert.equal(await readFile(path.join(root, 'public/assets/offline/sources.json'), 'utf8'), manifest);
  };
  return { root, run, assertPreserved };
}

test('offline preparation preserves manual JSON, photo links and the existing manifest', async t => {
  const setup = await fixture(t);
  const result = await setup.run();
  assert.match(result.stdout, /6 fotografías locales/);
  assert.doesNotMatch(result.stderr, /UNEXPECTED_NETWORK_REQUEST/);
  await setup.assertPreserved();
  assert.equal(await readFile(path.join(setup.root, 'public/assets/fonts/dm-sans-latin-wght-normal.woff2'), 'utf8'), 'Local font');
  assert.equal(await readFile(path.join(setup.root, 'public/licenses/Manrope-OFL.txt'), 'utf8'), 'Local license');
});

for (const field of ['src', 'thumbnail']) {
  test(`external ${field} is left untouched and never downloaded`, async t => {
    const setup = await fixture(t, { [field]: 'https://picsum.photos/id/237/600/400' });
    await assert.rejects(setup.run(), error => {
      assert.match(error.stderr, /imágenes locales/);
      assert.match(error.stderr, /public\/assets/);
      assert.doesNotMatch(error.stderr, /UNEXPECTED_NETWORK_REQUEST/);
      return true;
    });
    await setup.assertPreserved();
  });
}

test('missing local images fail preparation without rewriting content', async t => {
  const setup = await fixture(t, { src: '/assets/missing.jpg' });
  await assert.rejects(setup.run(), error => {
    assert.match(error.stderr, /ENOENT/);
    assert.doesNotMatch(error.stderr, /UNEXPECTED_NETWORK_REQUEST/);
    return true;
  });
  await setup.assertPreserved();
});
