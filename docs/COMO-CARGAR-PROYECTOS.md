# Cargar y modificar proyectos

Edita `src/content.json`. Ahora cada proyecto aparece una sola vez dentro de `projects`, y sus departamentos se cargan dentro del propio proyecto.

## Añadir un proyecto

1. Copia el objeto de [plantilla-proyecto.json](plantilla-proyecto.json) como una nueva entrada de `projects`.
2. Escribe un `id` único, en minúsculas, sin espacios ni tildes; por ejemplo, `agua-comunitaria`. Conserva ese identificador al cambiar el nombre para mantener sus enlaces.
3. Cambia `name` por el nombre del proyecto.
4. Dentro de `departments`, completa un bloque por territorio con sus actividades, logros e imágenes. Puedes dejar las listas vacías e ir añadiendo información.
5. Cuando quieras mostrar el proyecto en los filtros y el panel del mapa, cambia `verified` a `true` y conserva `demo: false`.

## Cargar departamentos al proyecto

Cada bloque de `departments` contiene:

| Campo | Qué escribir |
| --- | --- |
| `names` | Los nombres exactos de los departamentos de Honduras. |
| `axis` | La actividad principal o eje de trabajo. |
| `summary` | Un resumen de lo realizado. |
| `communities` | Una lista con las comunidades de intervención. |
| `activities` | Una lista de actividades, cada una entre comillas. |
| `achievements` | Una lista de logros. |
| `photos` | Una lista de fotografías. |

Si cada departamento tiene actividades diferentes, usa bloques separados:

```json
"departments": [
  {
    "names": ["Choluteca"],
    "activities": ["Actividad realizada en Choluteca"],
    "photos": []
  },
  {
    "names": ["Comayagua"],
    "activities": ["Actividad realizada en Comayagua"],
    "photos": []
  }
]
```

Si varios departamentos comparten las mismas actividades y fotografías, basta un bloque con `"names": ["La Paz", "Intibucá"]`. Los dos se resaltan en el mapa y las fotografías se cuentan una sola vez.

`axis` y `summary` también pueden escribirse una sola vez en el proyecto: los bloques que omitan esos campos heredan los valores comunes. Las listas `communities`, `activities`, `achievements` y `photos` son opcionales; omitirlas equivale a dejarlas vacías.

## Cargar fotografías

Copia la imagen a `public/FotosProyectos/`. En `photos` utiliza una ruta que empiece con `/FotosProyectos/`, sin escribir `public`:

```json
{
  "src": "/FotosProyectos/taller.png",
  "description": "Descripción de la actividad que aparece en la fotografía",
  "community": "Nombre de la comunidad",
  "date": "2026-10-27"
}
```

Solo `src` es obligatorio. Puedes añadir `featured: true` para colocar una foto al principio. El nombre del proyecto, su identificador y los departamentos se heredan automáticamente.

## Miniaturas independientes de cada mapa

Al final de `content.json`, `mapThumbnails` contiene tres grupos independientes:

| Grupo | Mapa |
| --- | --- |
| `cover` | Mapa de la portada; conserva las fotografías existentes. |
| `interactive` | Mapa interactivo con filtros. |
| `detail` | Mapas dentro del detalle de los proyectos. |

Dentro de cada grupo se configura una ruta por departamento. `interactive` y `detail` están vacíos mientras se eligen sus fotografías:

```json
"mapThumbnails": {
  "cover": { "Choluteca": "/fotosMapaCover/thumb-choluteca.jpg" },
  "interactive": { "Choluteca": "" },
  "detail": { "Choluteca": "" }
}
```

Una entrada vacía (`""`) muestra el color del departamento. El mapa interactivo y los mapas de detalle colorean los departamentos donde hay proyectos y mantienen el resto en gris. No utilizan imágenes de la portada ni de las galerías como reemplazo.

Para añadir una miniatura más adelante, copia su archivo a una carpeta de `public/` y escribe la ruta en el grupo correspondiente. Estas imágenes no se suman a los conteos de fotografías de los proyectos.

## Ayuda al editar y generar la presentación

El campo `$schema` activa sugerencias de campos, nombres de departamentos y avisos de estructura en editores compatibles con JSON Schema. No cambies su ruta.

Comprueba los datos y genera la versión web:

```powershell
npm.cmd test
npm.cmd run build
```

Para distribuir la presentación en Windows, genera de nuevo el ejecutable:

```powershell
npm.cmd run build:exe
npm.cmd run check:desktop
```
