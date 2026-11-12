# ASONOG · Nuestra Labor 2026 para Windows

## Abrir la presentación en otra computadora

1. Copia `release/ASONOG-Nuestra-Labor-2026-Portable.exe` a una memoria USB o al equipo de destino.
2. Ábrelo con doble clic en Windows 10 u 11 de 64 bits.
3. Recorre el mapa, las fotografías y los resultados. No necesita internet ni instalar Node.js.

Solo necesitas copiar el `.exe`. La primera apertura puede tardar unos segundos mientras prepara sus archivos.

## Completar y actualizar los resultados

El contenido se prepara manualmente en el proyecto:

1. Edita `src/content.json`. Dentro de cada departamento, cada objeto de `projects` agrupa su resumen, eje, comunidades de intervención, 4 actividades destacadas, 2 logros y 6 fotografías.
2. Copia las fotografías a `public/assets/` y añade sus rutas y descripciones dentro del proyecto correspondiente.
3. Para los registros revisados, utiliza `verified: true` y `demo: false`.
4. Genera el nuevo ejecutable desde PowerShell, dentro de la carpeta del proyecto:

```powershell
npm.cmd run build:exe
npm.cmd run check:desktop
```

5. Distribuye el nuevo archivo `release/ASONOG-Nuestra-Labor-2026-Portable.exe`.

Cada versión muestra los datos incluidos al generarla. Los ejemplos están identificados como demostración y se excluyen de las cifras publicadas. El README explica los campos del archivo de contenido.

La preparación verifica las imágenes locales, copia las fuentes y licencias, compila la aplicación y crea el ejecutable. Los archivos de fotografías se incorporan manualmente a `public/assets/`; las rutas de `src/content.json` se conservan. Si hay imágenes externas, la preparación pide una ruta local para que el ejecutable funcione sin conexión. Internet se necesita para instalar dependencias o conseguir nuevos recursos de forma manual.

## Comprobación sin conexión

`check:desktop` abre una ventana oculta con un perfil temporal y la red desactivada. Comprueba mapa, fotografías, filtros, zoom, gestos y navegación por teclado. También verifica que la presentación utiliza los archivos incluidos, aunque existan datos locales de versiones anteriores.

El informe se guarda en `release/verificacion-sin-conexion.json`. También puedes usar `node scripts/check-desktop.mjs`.

Los enlaces externos de atribución requieren conexión al visitarlos; el recorrido de la aplicación funciona sin abrirlos.
