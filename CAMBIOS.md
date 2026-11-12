# Registro de cambios

## 2026-11-11 · Texto adaptable en mapas y proyectos

- Incorporada una escala tipográfica fluida con cuatro variables globales para metadatos, cuerpo, encabezados y títulos de proyecto.
- La información al señalar un departamento, las fichas sin contenido, las comunidades, actividades, logros y textos de las fotografías ajustan su tamaño al ancho de pantalla.
- Retirados los tamaños fijos de móvil que impedían ese ajuste. Los límites en `rem` conservan tamaños legibles y respetan el tamaño de fuente del navegador.
- Los nombres de comunidad y proyecto en las tarjetas fotográficas pueden ocupar varias líneas; la ruta del departamento puede pasar a otra fila en pantallas estrechas.

## 2026-11-11 · Fondo de cabecera integrado en Inicio

- La cabecera de Inicio utiliza `--color-background`, igual que el resto de la portada. Las demás pantallas conservan su cabecera blanca.

## 2026-11-11 · Nombre del departamento en la barra superior

- El detalle muestra el nombre del departamento como título centrado en la barra superior, con la misma adaptación a móvil que el título del mapa.
- Retirado el título anterior del bloque de contenido; se conservan el botón «Volver al mapa» y la ruta del departamento.
- El contenido del detalle queda asociado al título de la cabecera para los lectores de pantalla.

## 2026-11-11 · Logotipo integrado en la portada

- En Inicio, el logotipo aparece sobre el título «Nuestra labor», dentro del bloque de presentación, y se retira de la cabecera.
- En el mapa y en el detalle del departamento, el logotipo permanece en la barra superior como acceso a Inicio.
- El control de pantalla completa sigue en la esquina superior derecha. El tamaño del logotipo de portada se ajusta con `--cover-logo-width`.

## 2026-11-11 · Paleta institucional y colores unificados

- La nueva paleta de nueve variables `--color-*` sustituye la paleta anterior de dorados y grises.
- Eliminadas las variantes cromáticas por componente, las mezclas de tonos y los degradados de fondos. Textos, superficies, etiquetas, controles y bordes comparten los mismos colores en todas las pantallas.
- Dorado para acentos y botones principales; verde oscuro para énfasis y foco; verde claro para selección de navegación. Los textos de cuerpo usan el gris oscuro de la paleta.
- Ambos mapas y la leyenda comparten tres estados: verde secundario para publicado, dorado para demostración y gris de borde para departamentos sin publicar.
- Todas las sombras comparten una única transparencia del gris oscuro. El fondo de los diálogos utiliza otra transparencia del mismo color.
- Actualizados el color del navegador y el fondo inicial del escritorio a `#E9E8E5`.

## 2026-11-11 · Paleta dorada y grises

- Aplicados los seis colores base en `src/styles/variables.css`: dorado, dorado suave, gris oscuro, gris secundario, papel y blanco.
- Fondos, botones, tarjetas, mapas, bordes, sombras y ventanas utilizan variantes derivadas de esas variables, sin colores verdes ni azules independientes.
- Los mapas comparten los colores de sus estados: dorado para contenido publicado, dorado suave para demostración y gris para departamentos sin contenido.
- Los textos secundarios usan una mezcla algo más oscura del gris para conservar su legibilidad sobre los fondos claros.
- Actualizados el color del navegador y el fondo inicial de la aplicación de escritorio para que coincidan con el fondo papel.

## 2026-11-11 · Descripciones visibles sin modal de fotografías

- Las fotografías de los proyectos muestran su descripción completa debajo de cada imagen, junto a comunidad, fecha y nombre del proyecto.
- El visor modal está desactivado: las fotografías son figuras informativas y no muestran el botón para ampliar.
- Se conservan el visor, sus controles, estilos, hooks y conexión con la aplicación. Para reactivarlo, cambiar `PHOTO_VIEWER_ENABLED` a `true` en `src/config.js`.
- Las descripciones permanecen visibles aunque falle la carga de una fotografía.

## 2026-11-11 · Fotografías sin campo de origen adicional

- Eliminado `sourceUrl` de las fotografías de `src/content.json` y de los datos de prueba.
- `src` conserva la ruta de cada imagen original; las miniaturas y los demás datos de las fotografías permanecen disponibles.

## 2026-11-11 · Título de la pantalla del mapa

- La cabecera muestra «Mapa interactivo» únicamente cuando la vista activa es el mapa; no aparece en Inicio ni en el detalle de un departamento.
- Título centrado en escritorio; en pantallas estrechas ocupa una fila propia para evitar solaparse con la marca y el control de pantalla completa.
- El tamaño se ajusta con `--header-page-title-size` en `src/styles/variables.css`.

## 2026-11-11 · Enlaces de fotografías conservados

- Retirada la descarga automática de imágenes y miniaturas de `scripts/prepare-offline.mjs`.
- La preparación del ejecutable valida los archivos locales y copia fuentes y licencias; ya no escribe `src/content.json` ni actualiza el antiguo manifiesto de descargas.
- `npm run dev` utiliza Vite directamente. Las URL de las fotografías se mantienen como se hayan escrito; las imágenes externas se muestran desde sus URL en la versión web.
- Para el ejecutable sin conexión, los archivos se incorporan manualmente en `public/assets/` y se referencian con rutas `/assets/...`.

## 2026-11-11 · Navegación con flechas limitada

- En Inicio y Mapa, ambas flechas horizontales alternan únicamente entre esas dos pantallas.
- Los detalles se abren seleccionando un departamento en el mapa. Desde el detalle, ← vuelve al mapa y → no cambia de pantalla ni de departamento.
- El visor mantiene sus flechas para cambiar de fotografía; Esc regresa a la galería.
- Actualizados `src/navigation.js`, su uso en `src/App.jsx`, las pruebas de navegación y los textos de ayuda.
- Las pruebas de interfaz ya siguen la presentación simplificada: comprueban el nuevo recorrido, el bloqueo de → en los proyectos y la conservación de su información desplegada. Los controles de búsqueda y filtros se comprueban cuando están visibles.
- La referencia SHA-256 anterior corresponde a la captura del estado manual; los archivos modificados posteriormente tendrán otras huellas.

## 2026-11-11 · Ajustes manuales de presentación

Estado revisado directamente en los archivos del proyecto. Esta versión simplificada es la referencia para continuar trabajando.

### Cabecera y portada

- `src/components/layout/AppHeader.jsx`: cabecera con logotipo, nombre ASONOG, año 2026 y control de pantalla completa. Ya no se muestra el menú de navegación ni la etiqueta de edición.
- `src/styles/layout.css`: logotipo con ancho `var(--size-110)`, altura automática y fondo verde comentado.
- `src/styles/variables.css`: tamaños globales adicionales `--size-48`, `--size-52`, `--size-56`, `--size-60` y `--size-110`.
- `src/components/cover/CoverHero.jsx`: portada centrada en el título, subtítulo y mapa. Se retiraron los botones de exploración y ayuda, la nota territorial y los textos debajo del mapa.
- `src/pages/CoverPage.jsx`: la sección `CoverThemes` está comentada. Su componente sigue disponible en el proyecto.
- El mapa de portada sigue siendo el acceso al mapa interactivo y conserva la flotación, las sombras y el seguimiento del cursor.

### Mapa interactivo

- `src/pages/MapPage.jsx`: título y descripción del mapa comentados; contador de departamentos retirado de la vista.
- `MapFilters` y `DepartmentExplorer` están comentados: no se muestran filtros, buscador ni lista lateral de departamentos.
- Aviso de demostración, cifras `MapMetrics` y nota de fuentes comentados en esta página.
- `src/styles/map.css`: la distribución base de `.mapcontent` utiliza `grid-template-columns: auto`. Las reglas para otros tamaños de pantalla permanecen en sus media queries.
- Los componentes ocultos y sus importaciones continúan en el código; no se eliminaron sus archivos ni su lógica de estado.
- Se conservan las fotografías dentro de las siluetas, nombres opcionales, zoom, arrastre, leyenda, ampliación y sombra del departamento señalado.
- Las siluetas no muestran contadores de fotos. La tarjeta al señalar un departamento presenta sus proyectos y contempla los filtros que puedan estar activos internamente.
- El foco se señala en el contorno del departamento, sin un rectángulo alrededor del grupo SVG.

### Detalle del departamento

- `src/pages/DepartmentDetail.jsx`: el nombre del departamento y el icono de ubicación se integraron en `.detail-header`, junto al botón «Volver al mapa» y la ruta `Honduras / departamento / período`.
- Se retiraron el texto «Historias del territorio» y la etiqueta de estado de publicación de la cabecera.
- Resumen del departamento, aviso de demostración, `ProjectFilters` y total de proyectos/fotografías comentados.
- La lógica de filtros y el estado vacío siguen presentes, aunque los selectores están ocultos.
- Se mantiene la agrupación por proyectos: cuatro actividades destacadas, comunidades de intervención, dos logros y seis fotografías; galería a la izquierda y tarjeta de información a la derecha en escritorio.

### Referencia para próximos trabajos

- Respetar esta interfaz simplificada al modificar componentes; la reactivación de secciones comentadas debe responder a una nueva petición.
- Continuar usando las variables globales de `src/styles/variables.css`.
- La cartografía utilizada se mantiene en `src/assets/honduras-departments.json`; el contenido manual, en `src/content.json`.
- Las pruebas generales de interfaz todavía contienen referencias a controles retirados, como `.primary`, `.nav`, `.map-filters` y `.dept-list`. Su adaptación queda pendiente; no se reactivarán controles para satisfacer esas pruebas.
- Esta revisión registra el código actual. No se ha compilado ni actualizado el ejecutable como parte del registro.

La carpeta no tiene un repositorio Git. Las huellas SHA-256 de los archivos de código, configuración y recursos quedan en [la referencia de archivos](docs/registros/2026-11-11.json), para detectar cambios posteriores.
