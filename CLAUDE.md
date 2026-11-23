# VisionLab — Frontend (memoria del proyecto)

> Archivo de memoria persistente. Se actualiza en cada cambio estructural (carpetas, rutas,
> contratos de API, decisiones). Leer esto antes de explorar el código.
> Backend: `C:\Users\USUARIO\source\repos\VisionLabApi` (tiene su propio `CLAUDE.md`).
> Repo: https://github.com/Johann-Yamil15/VisionLab

## Qué es
Microscopio digital para niños: toma o sube una foto de un hallazgo, la IA (CLI de Claude, vía backend) lo
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
- **Ninguna API key en el frontend.** La IA va SOLO por el backend (`/api/analisis`, `/api/chat`); `core/ai/ia.service.ts` es el cliente
  (400 → `SolicitudInvalidaError`, 503/red/timeout → `IaNoDisponibleError`).
- Las keys viejas (`AIzaSyB-cDig…`, `AIzaSyANor9…`) siguen en el historial: hay que revocarlas.
- `src/environments/` solo lleva la URL del API, nunca secretos.
- El `usuarioId` nunca lo manda el cliente (el backend lo ignora; sale del JWT). El token vive en localStorage (`visionlab.sesion`).

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
      ai/ia.service.ts analyze(), chat(); demo.service.ts + demo-data.ts = MODO DEMO (`?demo=1` / `?demo=0`, 6 fichas sin IA)
      auth/                AuthService (sesión JWT en localStorage `visionlab.sesion`), authInterceptor (Bearer a `API_URL`; 401 → cierra sesión), authGuard / invitadoGuard
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
      profile/             profile.page (portada, nivel/XP, estadísticas, medallas, retos, colección)
                           data-access/perfil.service (GET /api/usuarios)
                           data-access/gamificacion.ts TEMPORAL: niveles y 5 medallas calculados con los
                           hallazgos (las colecciones niveles/logros del backend están vacías) + spec
      info/                about.page
```
Rutas públicas: `/login`, `/registro` (invitadoGuard), `/atlas`, `/atlas/:id`, `/acerca`. Con sesión (authGuard): `/microscopio`, `/microscopio/vista-previa`, `/descubrimiento`, `/almanaque`,
`/almanaque/:id`, `/perfil` (todo lo demás redirige a `/microscopio`).
Convenciones: un feature no importa de otro, salvo `discovery` → `microscope/data-access/captura.store`
(flujo compartido). Lo que usan dos features va en `shared/`. Componentes `OnPush` + signals.
Estilos: usar tokens y clases globales; el SCSS de cada componente debe quedar chico (límite 6kB).

## Pendiente
- Recuperar contraseña, y que el nombre de usuario/medallas se refresquen sin recargar tras el login.
- Probar la IA real con 50 fotos y llenar la tabla de `docs/pruebas-ia.md`.
- PWA (manifest + service worker), 3D/RA.
- Las tarjetas ×N se agrupan en el cliente; mover la agrupación al backend.

## Bitácora de cambios
- 2026-11-22: login y registro (`features/auth`), `core/auth` (servicio, interceptor JWT, guards), botón "Cerrar sesión" en el perfil, sin barra de navegación en login/registro. Recuperado del stash `auth-jwt-gemini` y adaptado a la arquitectura actual (sin Gemini).
- 2026-11-22: detalle 3D: el chat del experto sale de la tarjeta de historia y se abre con un botón flotante (`.fab-chat`, círculo de 52px a la
  izquierda del de accesibilidad, mismas medidas y base; ícono X y color sol al abrirse) (panel propio en la misma columna; abrir uno pliega el otro; `--chat-msgs-max` acota la altura de `app-expert-chat`).
  Canguro: modelo nuevo `kangaroo_new` (rinaskylark, CC BY 4.0), con spec-gloss convertido a metal-rough.
- 2026-11-22: Atlas (controles y ficha), detalle 3D (`/atlas/:id`) y `app-toasts` pasan del HUD oscuro turquesa al sistema
  base (`.clay`, `.btn`, `.chip`, `.type-badge`, `.meter`, tokens; 0 colores sueltos en detalle 3D y toasts). El globo y su
  arranque (fondo oscuro, pines) se conservan. `TOKEN_CATEGORIA` (chips/etiquetas, AA con texto blanco) vs
  `COLOR_CATEGORIA` (pines brillantes) en `atlas.ts`. Pendiente a propósito: `microscope.page` sigue con HUD turquesa
  (cámara; la tarea original lo pedía así).
- 2026-11-22: `app-nav` reestructurado (destinos en un arreglo + `@for`, columnas iguales con `minmax(0,1fr)`, altura
  = `--nav-h` incluyendo el borde, tablet vertical centrada a 36rem, móvil horizontal compacto solo íconos con
  `--nav-h: 56px`, riel con scroll en ventanas bajas, fondo de activo en barra y riel). `expert-chat` fija su propio
  color de texto (`:host { color: var(--c-text) }`): heredaba blanco al alojarse en una página oscura.
- 2026-11-22: Atlas 3D, datos completos: `atlas.json` con modelo/sonido/habitat/puntos/créditos para los 12
  elementos (`ElementoAtlas` con `sonido`, `habitat`, `creditoModelo|Sonido|Habitat`), assets comprimidos
  (111 MB → 11 MB: glb meshopt, mp3 mono, fondos webp), `globe.gl` con import dinámico, ícono "Sin sonido".
  Visor `/atlas/:id` (`atlas-detail.page`): `@google/model-viewer` en su propio chunk (import dinámico),
  modelo sobre el hábitat (imagen CSS, no skybox), sonido manual, puntos 3D creados desde código, panel de historia
  con `app-expert-chat`, AR. Los `.glb` van con meshopt: `model-viewer` NO trae decodificador, está en
  `public/atlas3d/vendor/meshopt_decoder.js`. Estado y pendientes (AR/Quest en dispositivo real): `docs/atlas3d-pendientes.md`.
- 2026-11-21: OMNI-12 escáner conectado al backend (`ia.service`, 3 opciones con confianza < 60, campos
  amenazas/impacto/peligro, "Ver en el Atlas 3D" por coincidencia con atlas.json; `discovery` importa
  `AtlasService`, excepción a la regla de features). OMNI-13 modo demo + `docs/pruebas-ia.md`.
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
- 2026-10-14: prompt de análisis con responseSchema: "tipo" es un enum con las 12 etiquetas (ETIQUETAS_IA)
  y el prompt incluye GUIA_CATEGORIAS_IA (tipos.ts). normalizarTipo usa coincidencia exacta y luego palabras clave.
  Al mover Gemini al backend, portar prompt + esquema tal cual.
- 2026-10-16: rediseño de Mi perfil con las imágenes del usuario (public/profile/*.webp, originales en
  assets/images/profile sin versionar). Fondo topográfico del riel en public/decor. El buscador del perfil
  abre /almanaque?buscar=. Plugin ponytail desactivado en este proyecto (.claude/settings.local.json).
