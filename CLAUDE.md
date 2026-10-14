# VisionLab — Frontend (memoria del proyecto)

> Archivo de memoria persistente. Se actualiza en cada cambio estructural (carpetas, rutas,
> contratos de API, decisiones). Leer esto antes de explorar el código.
> Backend: `C:\Users\USUARIO\source\repos\VisionLabApi` (tiene su propio `CLAUDE.md`).
> Repo: https://github.com/Johann-Yamil15/VisionLab

## Qué es
Microscopio digital para niños: toma o sube una foto de un hallazgo, la IA (Gemini) lo
identifica, se guarda como **tarjeta coleccionable** en el almanaque y se puede chatear con un
experto sobre ella. Gamificación con puntos, niveles y medallas. Futuro: 3D / RA.
Concurso: museo El Rehilete, Pachuca. Fecha límite aprox.: **2026-10-29**.
Descripción, alcance y funcionalidad: **`docs/PROYECTO.md`**.
Diseño: **`design-system/visionlab/MASTER.md`** (leerlo antes de tocar la UI).

## Stack
Angular 20 (standalone, signals, OnPush, control flow `@if/@for`), SCSS, `lucide-angular` para
los íconos. **Sin SSR** (se quitó), sin Angular Material. Node 22, CLI 20.3.

## Cómo correr
```
npm install          # también activa el hook antisecretos
npm start            # http://localhost:4200  (usa environment.development → API https://localhost:44312/api)
npx ng build         # producción (environment.ts → apiUrl '/api', detrás de un proxy)
```

## Git
Ramas: `main` (producción) ← `develop` (integración) ← `feature/*`, `fix/*` por PR.
Hook antisecretos en `.githooks/pre-commit` (bloquea `AIza...`, llaves privadas y
credenciales en connection strings).

## Reglas de seguridad (NO romper)
- **Ninguna API key en el frontend.** Gemini va SOLO por el backend (pendiente: `/api/analisis`, `/api/chat`).
  Hoy `core/ai/gemini.service.ts` tiene `apiKey = ''` y responde `IaNoDisponibleError`.
- Las keys viejas (`AIzaSyB-cDig…`, `AIzaSyANor9…`) siguen en el historial: hay que revocarlas.
- `src/environments/` solo lleva la URL del API, nunca secretos.
- El `usuarioId` nunca lo manda el cliente (el backend lo ignora).

## Estructura (desde 2026-10-14, rama feature/jj-arquitectura-base)
```
src/
  styles.scss → styles/_tokens.scss (variables) · _base.scss · _components.scss (clases globales)
  environments/ environment.ts ('/api') · environment.development.ts (https://localhost:44312/api)
  app/
    app.ts|html|scss       shell: skip-link + <app-nav> + <main> + <app-accesibilidad>
    app.config.ts          router (input binding, view transitions), HttpClient(fetch), locale es-MX
    app.routes.ts          lazy loadComponent por página
    core/
      api/api.ts           API_URL
      ai/gemini.service.ts TEMPORAL (sin key); analyze(), chat(especie, pregunta)
      layout/app-nav       barra inferior (móvil) / riel lateral ≥1024px
    shared/
      models/              hallazgo (Hallazgo, AnalysisResult, NuevoHallazgo, Especie), perfil, chat-message
      data-access/hallazgos.service.ts  CRUD + agruparPorEspecie() (tarjetas ×N)
      ui/icons.ts          AppIcons (set Lucide de la app)
      ui/species-card      tarjeta coleccionable (inputs: especie, imagen, veces, fecha, variant 'compact'|'full')
      ui/expert-chat       chat con el experto (input: especie; método enfocar())
      ui/photo-viewer      visor de foto a pantalla completa: zoom (pellizco, rueda, doble toque, botones, teclado) y arrastre
      utils/               tipos.ts (12 categorías → color, ícono, fondo de carta y posiciones), imagen.ts, texto-ia.ts
      accesibilidad/       servicio (signal + localStorage) + panel flotante
    features/
      microscope/          microscope.page (lente, zoom hw/digital, pinch, linterna, galería),
                           preview.page (analizar), data-access/camera.service, captura.store
                           (sessionStorage: foto, resultado, guardadoId → sobrevive a F5)
      discovery/           discovery.page (tarjeta, autoguardado único, +puntos, chat)
      almanac/             almanac.page (grid, filtros por tipo, búsqueda), almanac-detail.page
                           (/almanaque/:id, otras capturas, borrar con diálogo, chat)
      profile/             profile.page + data-access/perfil.service (GET /api/usuarios)
      info/                about.page
```
Rutas: `/microscopio`, `/microscopio/vista-previa`, `/descubrimiento`, `/almanaque`,
`/almanaque/:id`, `/perfil`, `/acerca` (todo lo demás redirige a `/microscopio`).
Convenciones: un feature no importa de otro, salvo `discovery` → `microscope/data-access/captura.store`
(flujo compartido). Lo que usan dos features va en `shared/`. Componentes `OnPush` + signals.
Estilos: usar tokens y clases globales; el SCSS de cada componente debe quedar chico (límite 6kB).

## Pendiente
- Pantallas de login y registro + interceptor JWT (cuando el backend tenga JWT).
- Pasar Gemini al backend y borrar `core/ai/gemini.service.ts`.
- PWA (manifest + service worker), 3D/RA.
- Las tarjetas ×N se agrupan en el cliente; mover la agrupación al backend.

## Bitácora de cambios
- 2026-10-14: creado este archivo. `master` → `develop` + `main`. Hook antisecretos. Key fuera del código.
- 2026-10-14: `feature/jj-arquitectura-base`: arquitectura por features + rediseño completo
  "Explorador" (claymorphism, Fredoka/Nunito, Lucide). Se quitaron SSR y Angular Material.
  Documentación en `docs/PROYECTO.md`.
- 2026-10-14: detalle del hallazgo según la referencia del usuario: tarjeta 'full' (filas, paisaje, lema),
  paneles Resumen / Datos rápidos / Seguridad de la IA, chat con avatar, hojas decorativas en el shell.
  La IA ahora devuelve habitat, alimentacion, colores, tamano y lema.
- 2026-10-14: cartas con los 12 fondos diseñados por el usuario (public/cards/*.webp, originales en
  assets/images/cards sin versionar). Taxonomía de 9 tipos → 12 categorías; la carta solo superpone contenido.
- 2026-10-14: visor de foto con zoom; la foto de la carta 'full' se amplía con [ampliable] (detalle y descubrimiento).
