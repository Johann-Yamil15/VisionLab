# Atlas 3D — pendientes para revisar (lunes)

Estado al 2026-11-22. Los datos de los 12 elementos están en `public/atlas3d/atlas.json`.
Lo que falta depende casi todo del **visor 3D** (`<model-viewer>`), que todavía no existe.

## 1. Bloqueante: el visor 3D
- [ ] Instalar `@google/model-viewer` y cargarlo **solo** en la ruta del visor (`import()` dinámico).
- [ ] Crear la ruta `/atlas/:id` en `app.routes.ts` (lazy `loadComponent`). Hoy el botón
      "Explorar en 3D" (`atlas.page.ts`, `@if (e.modelo)`) apunta a ahí y cae en la redirección a `/microscopio`.
- [ ] Leer el elemento por `id` con `AtlasService.elementos$`.
- [ ] Cargar **bajo demanda** (nada de esto debe pedirse antes de abrir el visor):
  - modelo `.glb` con `loading="lazy"` y `reveal="interaction"`, usando `miniatura` como `poster`
  - sonido con `preload="none"` y reproducción solo al tocar un botón
  - fondo (`habitat`) como imagen diferida
- [ ] Hotspots: un `<button slot="hotspot-…" data-position data-normal>` por cada elemento de `puntos`.
- [ ] Si `sonido` está vacío, no mostrar el reproductor (en el Atlas ya sale el ícono "Sin sonido").
- [ ] Los `.glb` usan compresión **meshopt** (el decodificador viene dentro de model-viewer, funciona sin internet).

## 2. Ajustar coordenadas de los 36 puntos
Las `posicion` y `normal` salieron de los vértices reales de cada modelo (pose de reposo), pero
**no se han visto en pantalla**. Con el visor, abrir cada modelo y comprobar que el punto cae donde dice la etiqueta.
Para corregir uno: clic sobre el modelo → model-viewer da posición y normal exactas
(`positionAndNormalFromPoint`) → pegarlas en `atlas.json`.

- [ ] Si **todos** salen desplazados igual: es el centrado de model-viewer, se corrige con un solo ajuste global.
- [ ] Puntos más inciertos: panda (patas delanteras y cola, no se conoce la pose), ballena (aletas),
      baobab y amatista (formas irregulares).
- [ ] Escalas muy distintas entre modelos (ballena ~1400 unidades, baobab ~21, secuoya < 1). Es normal;
      si el encuadre de cámara queda mal en alguno, ajustar `camera-orbit` / `field-of-view` por modelo.

## 3. Revisar visualmente los modelos optimizados
Se comprimieron con `gltf-transform optimize` (meshopt + texturas WebP 1024 px). Se conserva el mismo
número de materiales, texturas y animaciones, pero la geometría se fusionó/limpió:
- [ ] **Baobab**: 122k → 11k vértices. Confirmar que se ve igual.
- [ ] **Canguro**: 70k → 49k vértices.
- [ ] **Diamante**: perdió 1 textura sin uso (3 → 2).
- Si algo se ve mal, reoptimizar el original (en `OmniScan Objetos/`) con menos agresividad o sin `--simplify`.

## 4. Contenido que falta
- [x] ~~Fondo de la secuoya~~: agregado (`bosque-secuoyas.webp`, 296 KB).
- Sonidos de panda, canguro y baobab: **no se tienen y está decidido así**; esas fichas muestran el ícono "Sin sonido".
- Modelo del panda: su crédito no lleva URL porque la fuente no la trae (solo autor y licencia). Está completo.
- [ ] **Nombres de fotógrafos de Pexels**: salieron de los nombres de archivo (ej. `robertkso` → "Robert Kso",
      `xiaoyi` → "Xiaoyi"). Verificar cómo aparecen en cada perfil.
- [ ] Sonidos recortados a 10 s: el viento de la secuoya ya no es "loopable"; si se quiere en bucle, buscar otro.

## 5. Créditos (obligatorios por CC BY)
Se muestran en la ficha del Atlas desde `creditoModelo`, `creditoSonido` y `creditoHabitat`.
- Modelos: Sketchfab, **CC BY 4.0** (autor + enlace).
- Sonidos: Freesound, **CC0** (enlace).
- Fondos: Pexels (licencia Pexels).
- [ ] Al agregar archivos nuevos, llenar su crédito en el JSON.

## 6. Antes de la presentación (martes)
- [ ] `npx ng build` sin errores y abrir el Atlas en celular real (carga del globo y de la ficha).
- [ ] Probar sin internet: el globo y las fichas deben funcionar (los modelos usan meshopt, no Draco).
- [ ] Revisar el peso: `public/atlas3d` ≈ 11 MB. No volver a meter archivos sin comprimir.
- [ ] Limpieza opcional: el SCSS del Atlas excede el presupuesto de 6 kB por ~650 bytes (aviso, no error).

## Referencia rápida
| Qué | Dónde |
|---|---|
| Datos | `public/atlas3d/atlas.json` |
| Tipo `ElementoAtlas` | `src/app/features/atlas/data-access/atlas.ts` |
| Página del Atlas | `src/app/features/atlas/atlas.page.ts` |
| Modelos / sonidos / fondos | `public/atlas3d/models/`, `sonidos/`, `habitats/` |
| Originales sin comprimir | `C:\VisionLab\OmniScan Objetos\` (no versionados) |

Presupuesto de peso por archivo (para cuando se agreguen más): modelo ≤ 1.5 MB, sonido ≤ 100 KB, fondo ≤ 350 KB.
