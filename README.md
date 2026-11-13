# Nuestra Labor 2026 · ASONOG

Presentación de resultados institucionales en React + Vite, con una aplicación portátil para Windows. Incluye mapa fotográfico de Honduras, filtros, cifras y galerías. Todo el contenido se prepara manualmente en el proyecto y se distribuye junto con la aplicación.

El estado actual de la interfaz y los ajustes manuales están documentados en [CAMBIOS.md](CAMBIOS.md). Algunas secciones descritas en este README se conservan en el código y están comentadas en las vistas actuales.

## Desarrollo

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

`build` genera la versión web en `dist/`, que debe servirse mediante HTTP.

## Organización del código

`src/main.jsx` inicia React y carga los estilos. `src/App.jsx` conecta las pantallas, la navegación y las ventanas. El resto está separado por responsabilidad:

```text
src/
  pages/                 Portada, mapa y detalle del departamento
  components/
    layout/              Cabecera y pie de página
    cover/               Presentación y temas de la portada
    map/                 Mapa, departamentos, controles, filtros y cifras
    projects/            Bloques de proyecto, información, filtros y galería
    photos/              Tarjeta fotográfica, visor y sus controles
    common/              Selector de filtro, filtros activos y diálogo base
    help/                Contenido de la ventana de ayuda
  hooks/                 Navegación de teclado, filtros, foco, zoom y gestos
  styles/                Variables globales y estilos por sección
  content.json           Resultados que se completan manualmente
  config.js              Opciones de presentación, como activar el visor de fotos
  data.js                Preparación inicial del contenido y la cartografía
  content.js             Reglas, validación y cálculos del contenido
  geometry.js            Preparación y validación del mapa
  navigation.js          Orden del recorrido y reglas de los atajos
  style.css              Entrada que importa los archivos de estilos
```

Para realizar cambios puntuales:

| Qué quieres cambiar | Componente o archivo | Estilos |
| --- | --- | --- |
| Colores, tipografía, espacios o medidas compartidas | `styles/variables.css` | Variables globales `:root` |
| Cabecera y navegación | `components/layout/AppHeader.jsx` | `styles/layout.css` |
| Pie de página | `components/layout/AppFooter.jsx` | `styles/layout.css` |
| Portada | `components/cover/CoverHero.jsx` y `CoverThemes.jsx` | `styles/cover.css` |
| Siluetas y fotografías del mapa | `components/map/MapDepartment.jsx` | `styles/map.css` |
| Zoom y controles del mapa | `components/map/MapControls.jsx` y `hooks/useMapCamera.js` | `styles/map.css` |
| Buscador y lista de departamentos | `components/map/DepartmentExplorer.jsx` | `styles/map.css` |
| Cifras publicadas | `components/map/MapMetrics.jsx` | `styles/map.css` |
| Tarjeta de información a la derecha | `components/projects/ProjectInformation.jsx` | `styles/projects.css` |
| Distribución de los proyectos | `components/projects/ProjectSection.jsx` | `styles/projects.css` |
| Galería y tarjetas de fotografías | `components/projects/ProjectGallery.jsx` y `components/photos/GalleryPhoto.jsx` | `styles/gallery.css` |
| Descripción debajo de cada fotografía | `components/photos/GalleryPhoto.jsx` | `styles/gallery.css` |
| Visor conservado y miniaturas | `components/photos/Viewer*.jsx` y `PhotoViewer.jsx` | `styles/viewer.css` |
| Filtros compartidos | `components/common/FilterSelect.jsx` y `FilterChips.jsx` | `styles/shared.css` |
| Ayuda y diálogos | `components/help/HelpModal.jsx` y `components/common/Modal.jsx` | `styles/modal.css` |

Las rutas de la tabla son relativas a `src/`. El contenido institucional se edita en `content.json`; los componentes reciben ese contenido mediante propiedades. Los hooks concentran el comportamiento y los componentes la presentación. No se necesitan dependencias adicionales.

## Ajustar el diseño manualmente

Los valores compartidos están agrupados en `src/styles/variables.css`, dentro de `:root`. `src/style.css` importa este archivo y los estilos de cada sección en un orden fijo:

- Paleta única: `--color-primary: #EFAE0D`, `--color-dark: #343435`, `--color-secondary: #66A330`, `--color-green-dark: #4C8030`, `--color-green-light: #81B631`, `--color-yellow-light: #FAB833`, `--color-background: #E9E8E5`, `--color-border: #D9D6D5` y `--color-white: #FFFFFF`.
- Uso uniforme: texto en `--color-dark`, fondos de página y etiquetas en `--color-background`, tarjetas y controles en `--color-white`, y bordes en `--color-border`. Los textos secundarios se distinguen por su tamaño y jerarquía, sin añadir otro gris.
- Acentos: botones principales y subrayados en `--color-primary`, hover del botón principal en `--color-yellow-light`, énfasis y foco en `--color-green-dark`, y selección de navegación en `--color-green-light`.
- Los dos mapas y su leyenda comparten `--color-map-published` (verde secundario), `--color-map-demo` (dorado) y `--color-map-empty` (gris de borde). Puedes ajustar esas tres asignaciones sin tocar cada mapa.
- Se eliminaron las variables de color por componente y los degradados de las superficies. Solo `--color-shadow` y `--color-overlay` usan transparencia del gris oscuro, para sombras y fondos de diálogos.
- Tipografía: `--font-family-body`, `--font-heading` y tamaños como `--font-size-12`.
- Información del mapa y los proyectos: `--font-size-info-small` (metadatos), `--font-size-info-body` (párrafos, actividades y descripciones), `--font-size-info-heading` (encabezados) y `--font-size-project-title` (nombre del proyecto). Usan `clamp()` con límites en `rem` y crecimiento según el ancho de la pantalla; se ajustan desde un solo lugar, sin sobrescribir los tamaños en móvil.
- Espaciados: `--space-8`, `--space-12`, `--space-16`, etc. Se utilizan en márgenes, rellenos y separaciones.
- Esquinas: `--radius-10`, `--radius-16`, `--radius-pill`, etc.
- Bordes y efectos: `--color-border`, `--border-default`, `--shadow`, `--focus-ring` y `--duration-fast`.
- Distribución: `--content-max-width`, `--page-gutter`, `--header-gutter`, `--cover-gutter` y tamaños compartidos como `--size-40`.
- Proyectos: `--project-info-width` (ancho de la tarjeta), `--project-gallery-columns` (columnas de fotografías) y `--project-photo-ratio` (proporción de las imágenes).
- Portada y mapa interactivo: sus títulos aparecen en la esquina superior izquierda, usan `--font-size-hero` y dejan el ancho disponible al mapa. Los logotipos se sitúan en la parte inferior; `--cover-logo-width` controla su tamaño. El detalle conserva el logotipo en la cabecera. Los títulos usan el peso 800.
- Título de cabecera: `--header-page-title-size` controla el texto del mapa y el nombre del departamento en la vista de detalle.
- Flotación del mapa de inicio: `--cover-map-float-duration` (duración del ciclo), `--cover-map-float-distance` (desplazamiento), `--cover-map-float-tilt` (inclinación) y las variables `--cover-map-elevation-shadow` y `--cover-map-ground-*` (sombras). El movimiento es más suave en móvil y se desactiva cuando el sistema solicita movimiento reducido.
- Seguimiento del cursor en ese mapa: `--cover-map-hover-distance` (desplazamiento máximo), `--cover-map-hover-duration` y `--cover-map-hover-easing` (suavidad). El comportamiento está en `hooks/useMapHover.js`; vuelve al centro al salir del mapa y respeta el movimiento reducido y los gestos táctiles.
- Mapa interactivo: `--map-elevation-shadow` (sombra general), `--map-department-hover-scale` (ampliación del departamento), `--map-department-hover-shadow` y `--map-department-hover-duration`. El departamento señalado se muestra por encima de los demás; su área de selección permanece fija para conservar el clic y el arrastre. El foco del teclado también lo destaca, y el movimiento reducido desactiva la ampliación.

Los sufijos numéricos indican el valor inicial en píxeles. Por ejemplo, cambiar `--space-12: 12px` a `--space-12: 14px` actualiza todos los espaciados que utilizan esa variable, sin cambiar los tamaños de texto ni las esquinas.

Los títulos usan `--font-size-hero`, `--font-size-section` y `--font-size-department`. Las variantes globales para tabletas y móviles están al final de `variables.css`. Cada archivo de sección contiene sus propias media queries para ajustar la distribución.

Para un cambio compartido, modifica una variable global. Para uno particular, edita el selector del archivo correspondiente y reutiliza `var(--nombre)`; si necesitas un valor compartido nuevo, decláralo en `variables.css`. Los estilos del proyecto usan clases explícitas, sin módulos CSS ni valores de color repetidos fuera de las variables. Los estilos en línea se reservan para el encuadre de imágenes, las transformaciones calculadas del visor y las variables de posición del cursor en el mapa de inicio.

Edita los archivos de `src/` y vuelve a compilar para actualizar `dist/` o el ejecutable.

## Completar los resultados manualmente

1. Edita `src/content.json`. Cada departamento contiene un resumen, miniaturas independientes para el mapa de portada (`coverMapThumbnail`) y el mapa interactivo (`mapThumbnail`), personas registradas y una lista `projects`. Cada proyecto reúne su nombre, eje, resumen, comunidades de intervención, **4 actividades destacadas, 2 logros y 6 fotografías**.
2. Copia las fotografías reales a `public/assets/`, por ejemplo `public/assets/fotos/taller.jpg`, y utiliza `/assets/fotos/taller.jpg` como `src`.
3. Revisa el contenido y genera una nueva compilación web o un nuevo ejecutable.

Ejemplo de estructura para completar dentro de `departments`:

```json
"Lempira": {
  "verified": false,
  "demo": false,
  "summary": "",
  "mapThumbnail": "/assets/mapas/lempira.jpg",
  "coverMapThumbnail": "/assets/mapas/lempira-portada.jpg",
  "beneficiaries": null,
  "projects": []
}
```

`coverMapThumbnail` define la imagen del departamento en el mapa de portada; `mapThumbnail` define la del mapa interactivo. Copia las imágenes a `public/assets/mapas/` y escribe sus rutas `/assets/mapas/...`. Ambos campos se configuran fuera de `projects` y no se incluyen en las galerías ni en sus conteos. Las miniaturas se muestran también con `verified: false`, `demo: false` y sin proyectos; el estado de publicación controla el acceso a los proyectos y las cifras. Si omites uno, lo dejas vacío o falla su carga, ese mapa muestra el color de fondo del departamento. Cada mapa utiliza únicamente su propio campo. Los filtros pueden ocultar departamentos, pero no cambian su miniatura.

Dentro de `projects`, añade un objeto por proyecto con esta estructura:

```json
{
  "id": "lempira-proyecto-1",
  "name": "Nombre del proyecto",
  "axis": "Eje de intervención",
  "summary": "Resumen del trabajo realizado durante el año.",
  "communities": ["Comunidad A", "Comunidad B"],
  "activities": ["Actividad destacada 1", "Actividad destacada 2", "Actividad destacada 3", "Actividad destacada 4"],
  "achievements": ["Logro documentado 1", "Logro documentado 2"],
  "photos": [
    { "src": "/assets/fotos/foto-1.jpg", "community": "Comunidad A" },
    { "src": "/assets/fotos/foto-2.jpg", "community": "Comunidad A" },
    { "src": "/assets/fotos/foto-3.jpg", "community": "Comunidad A" },
    { "src": "/assets/fotos/foto-4.jpg", "community": "Comunidad B" },
    { "src": "/assets/fotos/foto-5.jpg", "community": "Comunidad B" },
    { "src": "/assets/fotos/foto-6.jpg", "community": "Comunidad B" }
  ]
}
```

Usa identificadores `id` y nombres distintos dentro de cada departamento. El nombre del proyecto y su eje se heredan en las fotografías: no se repiten dentro de cada foto. Las comunidades de las fotos deben figurar en `communities` del mismo proyecto. La preparación del ejecutable valida las cantidades exactas de actividades, logros y fotografías e indica el proyecto que debes corregir.

Cuando la información esté revisada y lista para mostrarse, establece `verified: true` y `demo: false`. Los registros con `demo: true` son ejemplos visuales y quedan excluidos de las cifras publicadas. Las cifras generales se calculan desde los proyectos de los departamentos publicados; una comunidad compartida entre varios proyectos se cuenta una vez dentro de su departamento. Las personas se suman por departamento y pueden repetirse entre departamentos. `beneficiaries: null` indica un dato pendiente. Los ejemplos actuales reutilizan fotografías de muestra entre proyectos; reemplázalas por las seis fotografías reales de cada uno.

Cada fotografía puede incluir:

```json
{
  "src": "/assets/fotos/taller.jpg",
  "community": "",
  "date": "",
  "description": "",
  "featured": false,
  "focalX": 50,
  "focalY": 50
}
```

`featured: true` sitúa la imagen al principio de la galería de su proyecto. `focalX` y `focalY` ajustan el encuadre entre 0 y 100. Puedes añadir una versión ligera mediante `thumbnail`, y las dimensiones `width`, `height` y `thumbnailWidth` para imágenes adaptables. Usa originales de al menos 1600 píxeles cuando sea posible.

La aplicación muestra siempre los archivos incluidos en su compilación; los datos guardados por versiones anteriores en cada computadora no sustituyen ese contenido. Para actualizar la presentación, edita el proyecto y vuelve a compilar.

## Recorrido

- El mapa muestra fotos dentro de las siluetas departamentales, con zoom, desplazamiento y nombres. Al señalar o enfocar un departamento, su tarjeta muestra los nombres de los proyectos que coinciden con los filtros; las siluetas no llevan contadores de fotografías.
- La búsqueda admite nombres con o sin tildes. Los filtros por proyecto y eje actualizan los departamentos visibles y se conservan al volver desde una ficha. Cada departamento mantiene su propia `mapThumbnail`.
- Cada proyecto muestra su tarjeta de información junto a su galería. Los filtros actualizan ambos elementos; al filtrar por comunidad se conservan las actividades y logros del proyecto completo.
- En móvil se pueden desplegar las actividades y logros de cada proyecto por separado.
- Las fotografías muestran su descripción completa debajo de la imagen, directamente en el proyecto. Las tarjetas no abren una ventana modal.

El visor de fotografías se conserva en `components/photos/PhotoViewer.jsx`, sus componentes auxiliares, `hooks/usePhotoViewer.js` y `styles/viewer.css`. Para reactivarlo, cambia `PHOTO_VIEWER_ENABLED` de `false` a `true` en `src/config.js`; volverán la apertura al hacer clic, el zoom, las miniaturas y la navegación por fotografías.

## Windows sin conexión

```powershell
npm.cmd run build:exe
npm.cmd run check:desktop
```

El archivo `release/ASONOG-Nuestra-Labor-2026-Portable.exe` funciona en Windows 10/11 de 64 bits. Incluye su navegador, cartografía, fuentes, fotos y miniaturas. Basta con copiar ese ejecutable al equipo de destino.

`npm run dev` sirve el proyecto con Vite y conserva los enlaces escritos en `src/content.json`. Las URL externas se utilizan directamente al mostrar las imágenes en la versión web.

`prepare:offline` valida el contenido y las imágenes locales, y prepara las fuentes y licencias. Este paso conserva `coverMapThumbnail`, `mapThumbnail`, `photos[].src` y `thumbnail` exactamente como los escribiste: no descarga imágenes ni reescribe `content.json`. Para generar el ejecutable sin conexión, las imágenes deben estar en `public/assets/` con rutas `/assets/...` o estar incrustadas como datos. Si encuentra una URL externa, indica qué ruta debes preparar manualmente.

Consulta [USO-SIN-CONEXION.md](USO-SIN-CONEXION.md) para distribuir y actualizar el programa.

## Comprobación

```powershell
npm.cmd test
npm.cmd run check:ui
npm.cmd run check:desktop
```

Las pruebas revisan los datos, el mapa fotográfico, cinco tamaños de pantalla, filtros, visor, gestos y foco de teclado. También comprueban que el contenido incluido prevalece sobre datos locales de versiones anteriores y que el recorrido solo muestra resultados.

La navegación se verifica con la interfaz simplificada actual: las flechas alternan Inicio/Mapa, los departamentos se abren desde el mapa y → conserva el detalle sin cambios. La búsqueda y los filtros se comprueban cuando sus controles están visibles; en el informe, `null` indica que una comprobación opcional no se ejecutó.

`check:ui` utiliza un navegador Chromium oculto con perfil temporal; por defecto Microsoft Edge en Windows. Puedes elegir otro ejecutable con `ASONOG_TEST_BROWSER`. Las capturas web se guardan en una carpeta temporal. `check:desktop` desactiva la red y guarda el informe en `release/verificacion-sin-conexion.json`. Se conserva el comando `node scripts/check-desktop.mjs`.

## Cartografía y fuentes

La portada y el mapa comparten `src/assets/honduras-departments.json`. Para actualizar la cartografía, reemplaza ese archivo por un GeoJSON de los 18 departamentos de Honduras y recompila.

Fuente: [geoBoundaries, gbOpen HND ADM1](https://www.geoboundaries.org/api/current/gbOpen/HND/ADM1/), identificador `HND-ADM1-10453824`, versión `9469f09`. Datos de OpenStreetMap/Wambacher bajo [Open Data Commons Open Database License 1.0](https://www.openstreetmap.org/copyright). Se conservan las geometrías y propiedades del [GeoJSON simplificado original](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/HND/ADM1/geoBoundaries-HND-ADM1_simplified.geojson).

Las fuentes DM Sans y Manrope se incluyen localmente.

## Atajos

En las pantallas principales, tanto ← como → alternan únicamente entre **Inicio ↔ Mapa**. Los departamentos se abren seleccionándolos en el mapa, mediante clic o con Enter/Espacio al enfocarlos con el teclado.

Dentro del detalle de un departamento, ← vuelve al mapa y → no hace nada. Las flechas no abren departamentos ni permiten saltar de uno a otro; para cambiar de departamento hay que volver al mapa y seleccionarlo.

Las flechas funcionan también cuando el foco está en un botón o enlace. La ventana de información se cierra si la flecha cambia de pantalla. Si se reactiva el visor, las flechas cambian únicamente de fotografía dentro de él; Esc lo cierra y devuelve el foco a la galería. En los campos de búsqueda y filtros, las flechas conservan su función habitual.

F: pantalla completa. Esc: cerrar ventanas. Con el visor activado, + y − ajustan el zoom. Una pulsación de flecha cambia una pantalla; mantenerla presionada no salta varias pantallas.
