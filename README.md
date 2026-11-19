# Nuestra Labor 2026 · ASONOG

Presentación de resultados institucionales en React + Vite, con una aplicación portátil para Windows. Incluye un mapa general a pantalla completa con filtros por proyecto y actividad, y detalles de proyecto con su propio mapa, actividades, logros y galerías. Todo el contenido se prepara manualmente en el proyecto y se distribuye junto con la aplicación.

El estado actual de la interfaz y los ajustes manuales están documentados en [CAMBIOS.md](CAMBIOS.md). El código contiene las vistas actuales y el visor de fotografías opcional, que se activa desde `src/config.js`.

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
  pages/                 Portada, mapa general con filtros y detalle del proyecto
  components/
    layout/              Cabecera y pie de página
    cover/               Presentación de la portada
    map/                 Mapa, departamentos, controles, leyenda y fichas
    projects/            Bloques de proyecto, información y galería
    photos/              Tarjeta fotográfica, visor y sus controles
    common/              Diálogo base
    help/                Contenido de la ventana de ayuda
  hooks/                 Navegación de teclado, foco, zoom y gestos
  styles/                Variables globales y estilos por sección
  content.json           Proyectos con sus departamentos y resultados
  content.schema.json    Ayuda de edición y validación de la estructura
  config.js              Opciones de presentación, como activar el visor de fotos
  data.js                Preparación inicial del contenido y la cartografía
  content.js             Reglas, validación y normalización del contenido
  geometry.js            Preparación y validación del mapa
  projects.js            Preparación del menú y la cobertura de cada proyecto
  navigation.js          Rutas de proyectos y reglas de los atajos
  style.css              Entrada que importa los archivos de estilos
```

Para realizar cambios puntuales:

| Qué quieres cambiar | Componente o archivo | Estilos |
| --- | --- | --- |
| Colores, tipografía, espacios o medidas compartidas | `styles/variables.css` | Variables globales `:root` |
| Cabecera y navegación | `components/layout/AppHeader.jsx` | `styles/layout.css` |
| Pie de página | `components/layout/AppFooter.jsx` | `styles/layout.css` |
| Portada | `components/cover/CoverHero.jsx` | `styles/cover.css` |
| Siluetas y fotografías del mapa | `components/map/MapDepartment.jsx` | `styles/map.css` |
| Zoom y controles del mapa | `components/map/MapControls.jsx` y `hooks/useMapCamera.js` | `styles/map.css` |
| Mapa general, filtros y accesos a proyectos | `pages/ProjectsPage.jsx` | `styles/map-explorer.css` |
| Detalle del proyecto y su mapa | `pages/MapPage.jsx` | `styles/project-navigation.css` |
| Totales de actividades y fotografías | `projects.js` y `pages/MapPage.jsx` | `styles/project-navigation.css` |
| Tarjeta de información a la derecha | `components/projects/ProjectInformation.jsx` | `styles/projects.css` |
| Distribución de los proyectos | `components/projects/ProjectSection.jsx` | `styles/projects.css` |
| Galería y tarjetas de fotografías | `components/projects/ProjectGallery.jsx` y `components/photos/GalleryPhoto.jsx` | `styles/gallery.css` |
| Descripción debajo de cada fotografía | `components/photos/GalleryPhoto.jsx` | `styles/gallery.css` |
| Visor conservado y miniaturas | `components/photos/Viewer*.jsx` y `PhotoViewer.jsx` | `styles/viewer.css` |
| Filtros del mapa general | `pages/ProjectsPage.jsx` | `styles/map-explorer.css` |
| Ayuda y diálogos | `components/help/HelpModal.jsx` y `components/common/Modal.jsx` | `styles/modal.css` |

Las rutas de la tabla son relativas a `src/`. El contenido institucional se edita en `content.json`; los componentes reciben ese contenido mediante propiedades. Los hooks concentran el comportamiento y los componentes la presentación. No se necesitan dependencias adicionales.

## Ajustar el diseño manualmente

Los valores compartidos están agrupados en `src/styles/variables.css`, dentro de `:root`. `src/style.css` importa este archivo y los estilos de cada sección en un orden fijo:

- Paleta única: `--color-primary: #EFAE0D`, `--color-dark: #343435`, `--color-secondary: #66A330`, `--color-green-dark: #4C8030`, `--color-green-light: #81B631`, `--color-yellow-light: #FAB833`, `--color-background: #E9E8E5`, `--color-border: #D9D6D5` y `--color-white: #FFFFFF`.
- Uso uniforme: texto en `--color-dark`, fondos de página y etiquetas en `--color-background`, tarjetas y controles en `--color-white`, y bordes en `--color-border`. Los textos secundarios se distinguen por su tamaño y jerarquía, sin añadir otro gris.
- Acentos: subrayados en `--color-primary`, y énfasis, selección y foco en `--color-green-dark`. La paleta institucional completa permanece disponible en `variables.css`.
- Los dos mapas y su leyenda comparten `--color-map-published` (verde secundario), `--color-map-demo` (dorado) y `--color-map-empty` (gris de borde). Puedes ajustar esas tres asignaciones sin tocar cada mapa.
- Se eliminaron las variables de color por componente y los degradados de las superficies. Solo `--color-shadow` y `--color-overlay` usan transparencia del gris oscuro, para sombras y fondos de diálogos.
- Tipografía: `--font-family-body`, `--font-heading` y tamaños como `--font-size-12`.
- Información del mapa y los proyectos: `--font-size-info-small` (metadatos), `--font-size-info-body` (párrafos, actividades y descripciones), `--font-size-info-heading` (encabezados) y `--font-size-project-title` (nombre del proyecto). Usan `clamp()` con límites en `rem` y crecimiento según el ancho de la pantalla; se ajustan desde un solo lugar, sin sobrescribir los tamaños en móvil.
- Espaciados: `--space-8`, `--space-12`, `--space-16`, etc. Se utilizan en márgenes, rellenos y separaciones.
- Esquinas: `--radius-10`, `--radius-16`, `--radius-pill`, etc.
- Bordes y efectos: `--color-border`, `--border-default`, `--shadow`, `--focus-ring` y `--duration-fast`.
- Distribución: `--page-gutter`, `--header-gutter`, `--footer-gutter` y tamaños compartidos como `--size-40`.
- Proyectos: `--project-info-width` (ancho de la tarjeta), `--project-gallery-columns` (columnas de fotografías) y `--project-photo-ratio` (proporción de las imágenes).
- Portada y mapa interactivo: sus títulos aparecen en la esquina superior izquierda, usan `--font-size-hero` y dejan el ancho disponible al mapa. Los logotipos se sitúan en la parte inferior; `--cover-logo-width` controla su tamaño. El detalle conserva el logotipo en la cabecera. Los títulos usan el peso 800.
- Títulos del recorrido: `.map-explorer-heading h1` y `.project-page-nav .project-nav-title` controlan los títulos del mapa general y los detalles.
- Flotación del mapa de inicio: `--cover-map-float-duration` (duración del ciclo), `--cover-map-float-distance` (desplazamiento), `--cover-map-float-tilt` (inclinación) y las variables `--cover-map-elevation-shadow` y `--cover-map-ground-*` (sombras). El movimiento es más suave en móvil y se desactiva cuando el sistema solicita movimiento reducido.
- Seguimiento del cursor en ese mapa: `--cover-map-hover-distance` (desplazamiento máximo), `--cover-map-hover-duration` y `--cover-map-hover-easing` (suavidad). El comportamiento está en `hooks/useMapHover.js`; vuelve al centro al salir del mapa y respeta el movimiento reducido y los gestos táctiles.
- Mapa interactivo: `--map-elevation-shadow` (sombra general), `--map-department-hover-scale` (ampliación del departamento), `--map-department-hover-shadow` y `--map-department-hover-duration`. El departamento señalado se muestra por encima de los demás; su área de selección permanece fija para conservar el clic y el arrastre. El foco del teclado también lo destaca, y el movimiento reducido desactiva la ampliación.

Los sufijos numéricos indican el valor inicial en píxeles. Por ejemplo, cambiar `--space-12: 12px` a `--space-12: 14px` actualiza todos los espaciados que utilizan esa variable, sin cambiar los tamaños de texto ni las esquinas.

Los títulos usan `--font-size-hero` y `--font-size-section`. Las variantes globales para tabletas y móviles están al final de `variables.css`. Cada archivo de sección contiene sus propias media queries para ajustar la distribución.

Para un cambio compartido, modifica una variable global. Para uno particular, edita el selector del archivo correspondiente y reutiliza `var(--nombre)`; si necesitas un valor compartido nuevo, decláralo en `variables.css`. Los estilos del proyecto usan clases explícitas, sin módulos CSS ni valores de color repetidos fuera de las variables. Los estilos en línea se reservan para el encuadre de imágenes, las transformaciones calculadas del visor y las variables de posición del cursor en el mapa de inicio.

Edita los archivos de `src/` y vuelve a compilar para actualizar `dist/` o el ejecutable.

## Completar los resultados manualmente

Edita `src/content.json`. Cada proyecto se escribe una sola vez en `projects` y contiene sus bloques de departamentos. Los nombres y estados ya no se repiten por departamento.

La [guía para cargar proyectos](docs/COMO-CARGAR-PROYECTOS.md) incluye instrucciones y ejemplos. Puedes copiar [esta plantilla](docs/plantilla-proyecto.json) como una nueva entrada de `projects`.

Ejemplo de la nueva estructura:

```json
{
  "$schema": "./content.schema.json",
  "institution": "ASONOG",
  "period": "2026",
  "projects": [
    {
      "id": "nombre-del-proyecto",
      "name": "Nombre del proyecto",
      "verified": true,
      "demo": false,
      "beneficiaries": null,
      "departments": [
        {
          "names": ["Choluteca"],
          "axis": "Actividad principal",
          "summary": "Resumen del trabajo realizado.",
          "communities": ["Comunidad A"],
          "activities": ["Actividad realizada"],
          "achievements": ["Logro documentado"],
          "photos": [
            {
              "src": "/FotosProyectos/taller.png",
              "description": "Descripción de la actividad",
              "community": "Comunidad A",
              "date": "2026-10-27"
            }
          ]
        }
      ]
    }
  ],
  "mapThumbnails": {
    "cover": { "Choluteca": "/fotosMapaCover/thumb-choluteca.jpg" },
    "interactive": { "Choluteca": "" },
    "detail": { "Choluteca": "" }
  }
}
```

- `id` identifica el proyecto y su enlace. Debe ser único, en minúsculas y sin espacios ni tildes. Cambiar `name` conserva el enlace si mantienes el mismo `id`.
- `verified: true` y `demo: false` publican el proyecto completo. `demo: true` identifica una demostración que se muestra con su propia etiqueta.
- Cada bloque de `departments` contiene `names`, una lista de nombres exactos de departamentos. Usa bloques separados cuando tengan información distinta.
- Para trabajo compartido, escribe por ejemplo `"names": ["La Paz", "Intibucá"]` en un solo bloque. Ambos departamentos aparecen en el mapa y la evidencia se cuenta una vez.
- `axis` y `summary` son opcionales. Puedes definirlos en el proyecto para que los hereden los bloques que no indiquen sus propios valores.
- `communities`, `activities`, `achievements` y `photos` admiten cualquier cantidad, incluso listas vacías. Pueden omitirse mientras completas la información. Un proyecto publicado necesita al menos un bloque con departamentos.
- `beneficiaries` corresponde al proyecto completo y puede quedar en `null`; la interfaz actual no muestra esta cifra. Los detalles cuentan los departamentos únicos y las actividades y fotografías una vez por bloque territorial.

Copia las fotografías a una carpeta de `public/`. Por ejemplo, `public/FotosProyectos/taller.png` se escribe como `/FotosProyectos/taller.png`. En cada foto solo `src` es obligatorio. Puedes añadir `description`, `community`, `date`, `featured`, `thumbnail`, `width`, `height`, `thumbnailWidth`, `focalX` y `focalY`. El nombre del proyecto, su identificador, el eje y los departamentos se heredan automáticamente. `featured: true` coloca la imagen al principio y los valores de encuadre van de 0 a 100.

`mapThumbnails` separa las miniaturas en tres grupos por departamento: `cover` para la portada, `interactive` para el mapa con filtros y `detail` para los mapas dentro de cada proyecto. La portada conserva sus imágenes; los otros grupos están vacíos hasta que se elijan sus fotografías. Cada mapa usa únicamente su grupo. Si una entrada está vacía, falta o falla su carga, se muestra el color del departamento. En los mapas interactivo y de detalle, el verde señala los departamentos con proyectos y el resto aparece en gris. Estas miniaturas no forman parte de las galerías ni de sus conteos.

`$schema` apunta al esquema local que ofrece autocompletado, nombres de departamentos y avisos de estructura en editores compatibles. La preparación y las pruebas también validan los datos. La aplicación genera internamente la vista territorial de la portada a partir de los proyectos; no hay que mantener otra lista de resultados por departamento.

El respaldo previo a esta migración está en [content-antes-de-organizar-por-proyectos-2026-11-18.json](docs/registros/content-antes-de-organizar-por-proyectos-2026-11-18.json).

La aplicación muestra los datos incluidos en su compilación. Después de editar el contenido, vuelve a compilar la versión web o el ejecutable.

## Recorrido

- El mapa fotográfico de la portada abre el mapa general.
- El mapa general ocupa casi toda la pantalla, con zoom, arrastre y nombres opcionales. Colorea los departamentos donde hay proyectos; sus miniaturas independientes se incorporarán cuando se seleccionen.
- El panel permite filtrar por proyecto y actividad principal. El mapa resalta únicamente los departamentos donde se realizó la intervención que coincide con ambos filtros.
- Hacer clic en un departamento abre directamente su proyecto cuando solo hay uno. Si hay varios, muestra todos los proyectos completos en la misma página, uno debajo del otro, con sus mapas, actividades, logros y fotografías; si no hay proyectos, muestra un aviso.
- La vista de un departamento mantiene sus actividades e imágenes, tanto si contiene un proyecto como varios. Los demás departamentos quedan deshabilitados en sus mapas y cápsulas. Cada mapa conserva el zoom, el desplazamiento y la cobertura completa del proyecto.
- Para consultar otro departamento, vuelve al mapa general. Al volver, el departamento se deselecciona automáticamente; «Limpiar filtros» restablece toda la cobertura.
- «Ver detalle del proyecto» abre su ficha completa, con su propio mapa, departamentos, actividades, logros e imágenes. El filtro de actividad del mapa general no recorta el contenido del detalle.
- «Volver al mapa» conserva los filtros de proyecto y actividad, y limpia la selección del departamento. Esto también se aplica al regresar con el teclado o el historial del navegador. Al abrir el proyecto completo desde el panel, puedes seleccionar departamentos y usar «Mostrar todos los departamentos» para recuperar toda su evidencia.
- En móvil y tableta los filtros aparecen sobre el mapa y «Ver proyectos» despliega una lista compacta de accesos a los detalles.
- El mapa general utiliza `#/mapa`; `#/proyectos` sigue siendo compatible. Los enlaces `#/proyectos/<identificador>/mapa` conservan el acceso directo al detalle y funcionan con recarga e historial.
- Los enlaces de detalle admiten `?departamento=Choluteca` para abrir su evidencia territorial. La vista conjunta de los proyectos de un departamento utiliza `#/departamentos/<nombre>/proyectos`.
- El JSON continúa organizado por proyecto. La navegación y los archivos locales funcionan también sin conexión.

El visor de fotografías se conserva en `components/photos/PhotoViewer.jsx`, sus componentes auxiliares, `hooks/usePhotoViewer.js` y `styles/viewer.css`. Para reactivarlo, cambia `PHOTO_VIEWER_ENABLED` de `false` a `true` en `src/config.js`; volverán la apertura al hacer clic, el zoom, las miniaturas y la navegación por fotografías.

## Windows sin conexión

```powershell
npm.cmd run build:exe
npm.cmd run check:desktop
```

El archivo `release/ASONOG-proyectos-2026.exe` funciona en Windows 10/11 de 64 bits. Incluye su navegador, cartografía, fuentes, fotos y miniaturas. Basta con copiar ese ejecutable al equipo de destino.

`npm run dev` sirve el proyecto con Vite y conserva los enlaces escritos en `src/content.json`. Las URL externas se utilizan directamente al mostrar las imágenes en la versión web.

`prepare:offline` valida el contenido y las imágenes locales, y prepara las fuentes y licencias. Este paso conserva `mapThumbnails`, las rutas de `photos[].src` y `thumbnail` exactamente como los escribiste: no descarga imágenes ni reescribe `content.json`. Para generar el ejecutable sin conexión, las fotografías y miniaturas pueden estar en cualquier carpeta de `public/`, con rutas desde la raíz: por ejemplo, `public/FotosProyectos/taller.png` se escribe como `/FotosProyectos/taller.png`. Las imágenes pueden estar incrustadas como datos. Si encuentra una URL externa, indica qué ruta debes preparar manualmente.

Consulta [USO-SIN-CONEXION.md](USO-SIN-CONEXION.md) para distribuir y actualizar el programa.

## Comprobación

```powershell
npm.cmd test
npm.cmd run check:ui
npm.cmd run check:desktop
```

Las pruebas revisan los datos, la agrupación de proyectos, sus rutas, la cobertura del mapa, cinco tamaños de pantalla, fotografías, gestos y foco de teclado. También comprueban que el contenido incluido prevalece sobre datos locales de versiones anteriores y que el recorrido solo muestra resultados.

La navegación se verifica con el recorrido Inicio → Mapa general → Detalle del proyecto. Las pruebas comprueban el tamaño del mapa, los filtros combinados, la deselección del departamento al volver sin perder los filtros, los mapas del detalle, los enlaces directos, la recarga, el historial y la selección de departamentos.

`check:ui` utiliza un navegador Chromium oculto con perfil temporal; por defecto Microsoft Edge en Windows. Puedes elegir otro ejecutable con `ASONOG_TEST_BROWSER`. Las capturas web se guardan en una carpeta temporal. `check:desktop` desactiva la red y guarda el informe en `release/verificacion-sin-conexion.json`. Se conserva el comando `node scripts/check-desktop.mjs`.

Las capturas y la selección física mediante ratón y pinza se verifican en el navegador web. La ventana oculta de Electron comprueba carga de datos e imágenes, distribución, enlaces, selección de departamentos y teclado; los campos `mouseMapSelection` y `mapPinchZoom` quedan en `null` porque esa ventana no ofrece una superficie fiable para esas entradas físicas.

El plegado automático de la lista al cambiar a una pantalla estrecha se comprueba en web. En Electron oculto se verifica el botón de despliegue; `mobileResultsAutoCollapse` queda en `null` porque los avisos de media query pueden esperar un fotograma visible.

## Cartografía y fuentes

La portada y el mapa comparten `src/assets/honduras-departments.json`. Para actualizar la cartografía, reemplaza ese archivo por un GeoJSON de los 18 departamentos de Honduras y recompila.

Fuente: [geoBoundaries, gbOpen HND ADM1](https://www.geoboundaries.org/api/current/gbOpen/HND/ADM1/), identificador `HND-ADM1-10453824`, versión `9469f09`. Datos de OpenStreetMap/Wambacher bajo [Open Data Commons Open Database License 1.0](https://www.openstreetmap.org/copyright). Se conservan las geometrías y propiedades del [GeoJSON simplificado original](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/HND/ADM1/geoBoundaries-HND-ADM1_simplified.geojson).

Las fuentes DM Sans y Manrope se incluyen localmente.

## Atajos

En Inicio y el mapa general, tanto ← como → alternan entre esas dos pantallas. En los detalles individuales y en la vista conjunta de un departamento, ← vuelve al mapa general y → conserva la vista seleccionada.

Tab recorre departamentos, filtros, proyectos y controles; Enter abre el elemento enfocado, y Espacio también selecciona departamentos. En el mapa general, seleccionar un departamento abre su proyecto o la vista conjunta de todos sus proyectos y enfoca el contenido de la nueva página. En cada detalle, seleccionar un departamento enfoca sus actividades e imágenes. Las flechas conservan el comportamiento normal de los selectores y no repiten la navegación al mantenerlas pulsadas.

F: pantalla completa. Esc: cerrar ventanas. Los controles + y − amplían o reducen el mapa; arrastrar desplaza la vista sin seleccionar un departamento. Si se activa el visor de fotografías, sus atajos se conservan dentro de él.
