import { mkdir, readFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from '../src/content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const contentFile = path.join(root, 'src', 'content.json');
const content = JSON.parse(await readFile(contentFile, 'utf8'));
validateContent(content);

function validateImage(buffer, file) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return;
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return;
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return;
  if (buffer.subarray(0, 3).toString() === 'GIF') return;
  if (/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(buffer.toString('utf8', 0, 300))) return;
  throw new Error('El archivo no tiene un formato de imagen válido: ' + file);
}

const photos = Object.values(content.departments || {}).flatMap(department => department.projects.flatMap(project => project.photos));
// Solo se leen las rutas manuales. Este paso no descarga ni reescribe contenido.
for (const photo of photos) {
  for (const field of ['src', 'thumbnail']) {
    if (!photo[field] || photo[field].startsWith('data:')) continue;
    if (/^https?:\/\//i.test(photo[field])) throw new Error(`El ejecutable sin conexión requiere imágenes locales. Guarda la imagen en public/assets/ y escribe su ruta /assets/... en ${field}: ${photo[field]}. El enlace no se ha modificado.`);
    if (!photo[field].startsWith('/') || photo[field].startsWith('//')) throw new Error('La fotografía debe usar una ruta local: ' + photo[field]);
    const file = path.resolve(publicRoot, '.' + decodeURIComponent(new URL(photo[field], 'http://local').pathname));
    if (!file.startsWith(publicRoot + path.sep)) throw new Error('Ruta fuera de public: ' + photo[field]);
    validateImage(await readFile(file), file);
  }
}

const licenses = path.join(publicRoot, 'licenses');
await mkdir(licenses, { recursive: true });
const fonts = path.join(publicRoot, 'assets', 'fonts');
await mkdir(fonts, { recursive: true });
for (const [packageName, filename] of [['dm-sans', 'DM-Sans-OFL.txt'], ['manrope', 'Manrope-OFL.txt']]) {
  await copyFile(path.join(root, 'node_modules', '@fontsource-variable', packageName, 'LICENSE'), path.join(licenses, filename));
  const fontFile = packageName + '-latin-wght-normal.woff2';
  await copyFile(path.join(root, 'node_modules', '@fontsource-variable', packageName, 'files', fontFile), path.join(fonts, fontFile));
}
await copyFile(path.join(root, 'src', 'assets', 'honduras-departments.source.json'), path.join(licenses, 'honduras-departments.source.json'));
console.log('Contenido preparado sin conexión: ' + photos.length + ' fotografías locales.');
