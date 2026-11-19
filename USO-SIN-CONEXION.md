# ASONOG · Nuestra Labor 2026 para Windows

## Abrir la presentación en otra computadora

1. Copia `release/ASONOG-proyectos-2026.exe` a una memoria USB o al equipo de destino.
2. Ábrelo con doble clic en Windows 10 u 11 de 64 bits.
3. Abre «Explorar el mapa», filtra por proyecto o actividad y utiliza «Ver detalle del proyecto» para consultar su mapa, actividades y fotografías. No necesita internet ni instalar Node.js.

Solo necesitas copiar el `.exe`. La primera apertura puede tardar unos segundos mientras prepara sus archivos.

## Completar y actualizar los resultados

El contenido se prepara manualmente en el proyecto:

1. Edita `src/content.json`. En `projects`, cada proyecto se escribe una sola vez con su `id`, `name` y una lista `departments`. Dentro de cada bloque territorial, `names` indica los departamentos; después puedes cargar resumen, eje, comunidades, actividades, logros y fotos. Puedes copiar [la plantilla](docs/plantilla-proyecto.json) y seguir [la guía de carga](docs/COMO-CARGAR-PROYECTOS.md).
2. Copia las fotografías a una carpeta de `public/`, por ejemplo `public/FotosProyectos/`, y añade sus rutas y descripciones en `photos` del bloque correspondiente. Si varios departamentos comparten la misma información, utiliza `"names": ["La Paz", "Intibucá"]` en un solo bloque. `mapThumbnails` configura miniaturas independientes en `cover` (portada), `interactive` (mapa con filtros) y `detail` (mapas del detalle). Conserva las imágenes actuales en `cover`; los otros grupos están vacíos y utilizan colores para señalar los departamentos donde hay proyectos.
3. Para mostrar un proyecto revisado, utiliza `verified: true` y `demo: false` en el propio proyecto. Las listas pueden estar vacías mientras completas la información. El esquema local ofrece sugerencias y avisos de estructura al editar.
4. Genera el nuevo ejecutable desde PowerShell, dentro de la carpeta del proyecto:

```powershell
npm.cmd run build:exe
npm.cmd run check:desktop
```

5. Distribuye el nuevo archivo `release/ASONOG-proyectos-2026.exe`.

Cada versión muestra los datos incluidos al generarla. Los ejemplos están identificados como demostración y se excluyen de las cifras publicadas. El README explica los campos del archivo de contenido.

La preparación verifica las imágenes locales, copia las fuentes y licencias, compila la aplicación y crea el ejecutable. Los archivos de fotografías se incorporan manualmente a `public/`, por ejemplo con rutas `/FotosProyectos/taller.png`; las rutas de `src/content.json` se conservan. Si hay imágenes externas, la preparación pide una ruta local para que el ejecutable funcione sin conexión. Internet se necesita para instalar dependencias o conseguir nuevos recursos de forma manual.

## Comprobación sin conexión

`check:desktop` abre una ventana oculta con un perfil temporal y la red desactivada. Comprueba el mapa general, los filtros combinados, su conservación al volver desde los detalles, la cobertura de cada proyecto, actividades, fotografías, cinco tamaños de pantalla, zoom, gestos, enlaces e historial. También verifica que la presentación utiliza los archivos incluidos, aunque existan datos locales de versiones anteriores.

El informe se guarda en `release/verificacion-sin-conexion.json`. También puedes usar `node scripts/check-desktop.mjs`.

Los enlaces externos de atribución requieren conexión al visitarlos; el recorrido de la aplicación funciona sin abrirlos.
