# Atlas 3D — estado y pendientes

Estado al 2026-11-22. Datos en `public/atlas3d/atlas.json`; visor en `/atlas/:id`
(`src/app/features/atlas/atlas-detail.page.*`). Rama de trabajo actual: `feature/OMNI-8-T7`.

## Hecho
- 12 elementos con modelo, hábitat, ≥ 3 puntos y créditos (`creditoModelo`, `creditoSonido`, `creditoHabitat`).
- **Modelos validados:** los 12 abren y se dibujan en el [Editor de model-viewer](https://modelviewer.dev/editor/) y el
  validador oficial de glTF da **0 errores** (solo advertencias inofensivas `NODE_SKINNED_MESH_NON_ROOT` en los 4 con esqueleto).
  Pesan entre 0.03 y 1.4 MB. Los originales de jaguar, elefante, oso y ballena tenían errores; la versión optimizada no.
- Visor `/atlas/:id` con `@google/model-viewer` (carga diferida en su propio chunk, ~122 KB comprimido):
  - modelo a pantalla completa, `camera-controls`, giro automático que se detiene al tocar/arrastrar,
    barra de carga y mensaje si el archivo falla;
  - fondo del hábitat detrás del modelo, sonido con ▶/⏸ (nunca se reproduce solo), "Proyectar holograma" (AR) y "Volver al globo";
  - tarjeta de historia colapsable (foto, científico, región, conservación, descripción, créditos);
  - chat del experto aparte, con botón flotante **IA** junto al de accesibilidad (panel propio; pliega la historia; Escape
    o ✕ lo cierran; conserva la conversación).
- **Puntos 3D (OMNI-7):** punto que pulsa + línea + etiqueta + tarjeta pegada al modelo (sigue al girar y se oculta
  detrás); abrir uno cierra el anterior; la cámara gira hacia la parte y regresa al cerrar; se cierra con ✕, Escape
  (devuelve el foco) o tocando fuera; tocar un punto no gira el modelo; `aria-label`/`aria-expanded`/`aria-controls`;
  sin pulso ni deslizamiento con "reducir movimiento".
  Probado con mouse y teclado reales (25 comprobaciones) en navegador de escritorio.
- **La tarjeta de un punto nunca se sale ni choca con otras** (historia, chat, botones de arriba, barra inferior):
  con poco ancho en el visor (celular, o laptop de ~1024 px con la historia abierta) se abre encima del punto y centrada;
  mientras la cámara se desliza se mantiene dentro del visor; en pantallas muy bajas (celular horizontal) se encoge y se
  desplaza por dentro. Medido abriendo los 3 puntos de los 12 modelos (36 tarjetas) en 1280×800, 1024×768, 768×1024,
  390×844 y 844×390: 0 choques. Antes, en 1024×768, 10 de 12 tarjetas se empalmaban con la de historia.
- Atlas (controles y ficha), detalle 3D y avisos (toasts) usan el sistema de diseño base (`.clay`, `.btn`, `.chip`…).
- Si falta modelo, sonido o fondo la página no se rompe (probado bloqueando cada archivo).
- Peso: `public/atlas3d` ≈ 11 MB (antes 111 MB). Modelos 6.4 MB.

## Pendiente
### 1. Requiere un dispositivo real
- [ ] **Dedo en celular real:** tocar puntos, girar el modelo, abrir/cerrar el chat y la historia.
- [ ] **AR en celular** (el botón solo aparece si el dispositivo lo soporta). Probar en Android (Chrome) y iPhone;
      `ar-modes="webxr scene-viewer quick-look"`. *Riesgo:* un Android sin WebXR cae a Scene Viewer, que recibe el
      `.glb` con meshopt + texturas WebP y puede no abrirlo. En Chrome usa WebXR y debería ir bien.
- [ ] **Meta Quest:** seleccionar puntos con la mano, giro y botón de holograma (Quest soporta WebXR).
- [ ] Rendimiento del globo y del visor en un celular real; menú inferior y botones flotantes con muesca (iPhone) y en horizontal.
- Para probar AR hace falta **HTTPS** (no sirve `http://192.168.x.x`). Hoy no hay despliegue registrado: usar la versión
  desplegada o un túnel HTTPS, con `?demo=1` para no depender del backend (que en desarrollo es `https://localhost:44312`).

### 2. Delegado a compañeros
- [ ] **Chat con el backend real:** solo se probó en modo demo (`?demo=1`); falta confirmar que `/api/chat` responde
      sobre la especie correcta.
- [ ] **HTTPS / túnel** para abrir la app en el celular (ver arriba).

### 3. Panoramas 360° de hábitat (siguiente tarea)
Hoy los fondos son fotos normales de Pexels (`habitats/*.webp`); la tarea pide panoramas equirectangulares.
- Fuente: Poly Haven (HDRIs CC0): [Forest & Woodland](https://polyhaven.com/hdris/forest-woodland), Desert & Arid,
  Coast & Water. Para selva, río, sabana, ártico y cueva hay que buscar a mano (no se confirmó que existan).
- Según la doc de model-viewer: `skybox-image` acepta PNG/HDR/JPG; `environment-image` acepta `.hdr`/`.jpg` y se limita a
  1k. Lo recomendado es un JPG grande (~2048×1024) de skybox + un HDR de 1k para la luz.
- Cuando lleguen los archivos hay que **adaptar el visor**: usar `skybox-image` (+ `environment-image`) en lugar del fondo
  CSS, ajustar `skybox-height` por hábitat (el horizonte puede dejar el modelo "flotando"), agregar un campo opcional al JSON
  y **mantener la foto actual como respaldo** donde no haya panorama. Presupuesto de peso: skybox ≤ ~400 KB.

### 4. Revisión visual menor
- [ ] Puntos 3D: caen sobre el cuerpo en jaguar, oso polar, panda, baobab, nenúfar y canguro. **Los de elefante, ballena,
      secuoya, obsidiana, diamante y amatista no se revisaron a ojo** (cargan bien). Para corregir uno: clic sobre el modelo
      en el Editor → `positionAndNormalFromPoint` → pegar en `atlas.json`.
- [ ] El modelo del **nenúfar** es una *colección* de plantas (varios nenúfares y una flor), no un solo nenúfar gigante.
- [ ] La **ballena** aparece pequeña en el encuadre inicial (~1400 unidades de largo): si molesta, ajustar `camera-orbit` / `field-of-view`.

### 5. Calidad
- [ ] No hay pruebas unitarias del visor, los puntos 3D, el chat flotante ni el menú (tampoco se corrieron las existentes).
- [ ] Avisos de presupuesto de SCSS (6 kB; el error es a 10 kB): `atlas.page` 6.30 kB, `atlas-detail.page` 7.22 kB.
- [ ] `microscope.page` sigue con el HUD turquesa (excepción acordada; es la cámara).
- [ ] **Commit/PR** de los cambios de esta rama (puntos 3D, fix del sonido, notas).

## Contenido (decidido, sin pendientes bloqueantes)
- Sonidos que no hay (la ficha muestra "Sin sonido"): panda, canguro y baobab. Los criterios de cantidad/duración de
  sonidos y modelos **se dieron por no importantes** (los sonidos duran entre 0.4 y 10 s).
- Modelo del panda: su crédito no lleva URL porque la fuente no la trae.
- Modelo del canguro: `kangaroo_new.glb` (autor rinaskylark, CC BY 4.0, enlace de Sketchfab en el crédito).
- [ ] Nombres de fotógrafos de Pexels: salieron de los nombres de archivo (ej. `robertkso` → "Robert Kso", `xiaoyi` → "Xiaoyi").
- Los créditos de sonido llevan el enlace de Freesound y CC0, sin el nombre del autor.

## Decisiones que se apartan de la tarea originales
1. **Fondo como imagen CSS, no `skybox-image`** (las fotos no son panoramas). Se resuelve con el punto 3 de arriba.
2. **Los `.glb` usan compresión meshopt**, y `model-viewer` **no trae decodificador por defecto**. Se aloja en
   `public/atlas3d/vendor/meshopt_decoder.js` (MIT, 29 KB) y se registra al cargar el visor. Funciona sin internet.
3. **Puntos 3D creados desde código**, no con `@for`: `model-viewer` solo registra un hotspot si su `slot` ya existe
   cuando entra al DOM, y con un binding de Angular llegaría tarde.
4. **Tarjetas de los puntos con el estilo claro del sistema de diseño**, no el HUD oscuro que pedía OMNI-7.
5. El chat recibe `tipo` según la categoría (fauna → "Otro", flora → "Plantas", mineral → "Rocas y minerales");
   el backend solo usa nombre, científico y descripción.

## Optimización de modelos (importante si se agregan más)
`gltf-transform optimize --compress meshopt --texture-compress webp --texture-size 1024` **más**
`--palette false --join false --instance false --flatten false --simplify false`. Si el modelo usa
`KHR_materials_pbrSpecularGlossiness` (extensión obsoleta), correr antes `gltf-transform metalrough`.
La primera pasada (con las opciones por defecto) **deformó el baobab** (tronco torcido, textura estirada); se detectó
comparando el render con el original. Revisar siempre contra el original antes de aceptar un modelo.
Originales sin comprimir: `C:\VisionLab\OmniScan Objetos\` (no versionados).
Presupuesto al agregar archivos: modelo ≤ 1.5 MB, sonido ≤ 100 KB, fondo ≤ 350 KB.

## Cómo agregar un elemento al Atlas
Con el script `scripts/atlas-agregar.mjs` (optimiza el modelo, copia los archivos y agrega **solo** la entrada nueva a
`atlas.json`, sin reescribir el resto del archivo):
```
node scripts/atlas-agregar.mjs --id cuarzo-rosa --nombre "Cuarzo rosa" --categoria mineral   --modelo C:\modelososa.glb --credito-modelo "Modelo: \"x\" por Y · Sketchfab (url) · CC BY 4.0"   --lat 19.4 --lng -99.1 --region "Hidalgo, México" --descripcion "Un cuarzo de color rosa pálido."   --alias "cuarzo rosado,rose quartz" --foto rosa.jpg --sonido rosa.mp3 --habitat selva.webp --dry-run
```
- Quita `--dry-run` para escribir. `node scripts/atlas-agregar.mjs --ayuda` lista todas las opciones.
- Optimiza con `gltf-transform` (las opciones de la sección de abajo; `--metalrough` si el modelo es spec-gloss). Requiere
  `@gltf-transform/cli` (`npm i -D @gltf-transform/cli`). Si el `.glb` ya viene optimizado con meshopt, usa `--sin-optimizar`.
- Límites: modelo ≤ 1.5 MB, sonido ≤ 100 KB, fondo ≤ 350 KB (`--forzar` los ignora y deja un aviso).
- `--habitat` acepta un fondo que ya exista en `habitats/` (por nombre) o un archivo nuevo.
- `--alias` son sinónimos con los que la IA puede nombrar la especie; `buscarEnAtlas` los usa para mostrar "Ver en el Atlas 3D".
- Queda **pendiente a mano**: los `puntos` 3D (el script deja `puntos: []`; se sacan con el Editor de model-viewer) y revisar el
  modelo contra el original. Respetar siempre la licencia y poner el crédito.

## Antes de la presentación (martes)
- [ ] `npx ng build` sin errores; entrar a varios elementos del Atlas en celular real.
- [ ] Probar sin internet (decodificador y modelos son locales; el chat necesita el backend o `?demo=1`).

## Referencia rápida
| Qué | Dónde |
|---|---|
| Datos | `public/atlas3d/atlas.json` |
| Tipo `ElementoAtlas`, colores y nombres de categoría | `src/app/features/atlas/data-access/atlas.ts` |
| Globo | `src/app/features/atlas/atlas.page.ts` |
| Visor 3D y puntos | `src/app/features/atlas/atlas-detail.page.{ts,html,scss}` |
| Decodificador meshopt | `public/atlas3d/vendor/meshopt_decoder.js` |
| Modelos / sonidos / fondos | `public/atlas3d/models/`, `sonidos/`, `habitats/` |
