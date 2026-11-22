# Atlas 3D — estado y pendientes

Estado al 2026-11-22. Datos en `public/atlas3d/atlas.json`; visor en `/atlas/:id`
(`src/app/features/atlas/atlas-detail.page.*`).

## Hecho
- 12 elementos con modelo, hábitat, ≥ 3 puntos y créditos (`creditoModelo`, `creditoSonido`, `creditoHabitat`).
- Visor `/atlas/:id` con `@google/model-viewer` (carga diferida en su propio chunk, ~122 KB comprimido):
  - modelo a pantalla completa, `camera-controls`, giro automático que se detiene al tocar/arrastrar,
    barra de carga y mensaje si el archivo falla;
  - fondo del hábitat detrás del modelo, sonido con ▶/⏸ (nunca se reproduce solo), puntos 3D tocables;
  - panel de historia colapsable (foto, científico, región, conservación, descripción, créditos) con el chat del experto;
  - "Proyectar holograma" (AR) y "Volver al globo".
- Si falta modelo, sonido o fondo la página no se rompe (probado bloqueando cada archivo).
- Peso: `public/atlas3d` ≈ 11 MB (antes 111 MB). Modelos 6.8 MB.

## Decisiones que se apartan de la tarea (revisar con el equipo)
1. **Fondo como imagen CSS, no `skybox-image`.** Las fotos de hábitat son fotos normales (Pexels), no
   panoramas equirectangulares: como skybox saldrían deformadas. Se usan detrás del modelo, con un velo
   oscuro, y `environment-image="neutral"` para la luz. Si se quiere skybox real hacen falta panoramas 360°.
2. **Los `.glb` usan compresión meshopt**, y `model-viewer` **no trae decodificador por defecto**. Se aloja en
   `public/atlas3d/vendor/meshopt_decoder.js` (MIT, 29 KB) y se registra al cargar el visor. Sin eso los modelos no cargan.
   Funciona sin internet.
3. **Puntos 3D creados desde código**, no con `@for` en la plantilla: `model-viewer` solo registra un hotspot si su
   `slot` ya existe cuando entra al DOM, y con un binding de Angular llegaría tarde.
4. El chat recibe `tipo` según la categoría (fauna → "Otro", flora → "Plantas", mineral → "Rocas y minerales");
   el backend solo usa nombre, científico y descripción.

## Pendiente — requiere un dispositivo real
- [ ] **AR en celular** (el botón solo aparece si el dispositivo lo soporta; en el navegador de escritorio no sale).
      Probar en Android (Chrome) y iPhone. `ar-modes="webxr scene-viewer quick-look"`.
      *Riesgo:* si un Android cae al modo `scene-viewer` (navegador sin WebXR), Google Scene Viewer recibe el `.glb`
      con meshopt + texturas WebP y puede no abrirlo. En Chrome usa WebXR y debería ir bien.
- [ ] **Meta Quest**: probar giro con la mano y el botón de holograma (Quest soporta WebXR).
- [ ] Probar en celular real el rendimiento del globo y del visor.

## Pendiente — revisión visual
- [ ] Puntos 3D: probados en navegador sin interfaz con captura. Se vio que caen sobre el cuerpo en
      jaguar, oso polar, panda, baobab, canguro y nenúfar. **Los otros 6 cargan, pero no se revisaron a ojo**
      (elefante, ballena, secuoya, obsidiana, diamante, amatista). Para corregir uno: clic sobre el modelo →
      `positionAndNormalFromPoint` → pegar en `atlas.json`.
- [ ] El modelo del **nenúfar** es una *colección* de plantas (varios nenúfares y una flor), no un solo nenúfar gigante.
- [ ] El **canguro** se ve completamente blanco (el original también): el modelo no trae color.
- [ ] Modelos grandes (ballena ~1400 unidades, baobab ~21): si el encuadre inicial queda mal, ajustar
      `camera-orbit` / `field-of-view`.

## Contenido
- Sonidos que no hay (a propósito, la ficha muestra "Sin sonido"): panda, canguro, baobab.
- Modelo del panda: su crédito no lleva URL porque la fuente no la trae.
- [ ] Nombres de fotógrafos de Pexels: salieron de los nombres de archivo (ej. `robertkso` → "Robert Kso", `xiaoyi` → "Xiaoyi").
- Sonidos recortados a 10 s: el viento de la secuoya ya no es "loopable".

## Optimización de modelos (importante si se agregan más)
Se optimizó con `gltf-transform optimize --compress meshopt --texture-compress webp --texture-size 1024` **más**
`--palette false --join false --instance false --flatten false --simplify false`.
La primera pasada (con las opciones por defecto) **deformó el baobab** (tronco torcido, textura estirada, error
"Mesh is missing primitive index association"); se detectó comparando el render con el original. Con las opciones
conservadoras el render es idéntico al original. Revisar siempre contra el original antes de aceptar un modelo.
Originales sin comprimir: `C:\VisionLab\OmniScan Objetos\` (no versionados).

## Antes de la presentación (martes)
- [ ] `npx ng build` sin errores; abrir `/atlas` y entrar a varios elementos en celular real.
- [ ] Probar sin internet (decodificador y modelos son locales; el chat necesita el backend o `?demo=1`).
- [ ] Presupuesto de peso al agregar archivos: modelo ≤ 1.5 MB, sonido ≤ 100 KB, fondo ≤ 350 KB.
- Aviso conocido, no error: el SCSS de `atlas.page` excede 6 kB por ~650 bytes (ya existía).

## Referencia rápida
| Qué | Dónde |
|---|---|
| Datos | `public/atlas3d/atlas.json` |
| Tipo `ElementoAtlas`, colores y nombres de categoría | `src/app/features/atlas/data-access/atlas.ts` |
| Globo | `src/app/features/atlas/atlas.page.ts` |
| Visor 3D | `src/app/features/atlas/atlas-detail.page.{ts,html,scss}` |
| Decodificador meshopt | `public/atlas3d/vendor/meshopt_decoder.js` |
| Modelos / sonidos / fondos | `public/atlas3d/models/`, `sonidos/`, `habitats/` |
