# VisionLab — Frontend (memoria del proyecto)

> Archivo de memoria persistente. Se actualiza en cada cambio estructural (carpetas, rutas,
> contratos de API, decisiones). Leer esto antes de explorar el código.
> Backend: `C:\Users\USUARIO\source\repos\VisionLabApi` (tiene su propio `CLAUDE.md`).

## Qué es
Microscopio digital para niños: toma/sube una foto de un hallazgo (insecto, hoja, roca, hongo...),
la IA (Gemini) lo identifica, se guarda como **tarjeta coleccionable** (estilo Pokémon) en la
bitácora/almanaque del niño, y puede chatear con la IA sobre ese hallazgo. Gamificación con
puntos, niveles y medallas. Futuro: modelos 3D / realidad aumentada.
Concurso: Rehilete Pachuca. Fecha límite aprox.: **2026-10-29**.

## Stack
- Angular 20 (standalone components, signals), Angular Material, SCSS.
- Actualmente con SSR (`@angular/ssr`, `src/server.ts`) → **se va a quitar** (app de cámara, solo cliente).
- Node 22, Angular CLI 20.3.

## Cómo correr
```
npm install
npm start            # http://localhost:4200
```
Backend debe estar en marcha (ver CLAUDE.md del backend).

## Reglas de seguridad (NO romper)
- **Ninguna API key en el frontend.** Todo lo que llega al navegador es público.
  Gemini se llama SOLO desde el backend (`/api/analisis`, `/api/chat`).
- La key vieja de Gemini quedó en el historial (commit `783ec27`) y está revocada.
- La URL del API va en `src/environments/` — nunca secretos ahí.
- El `usuarioId` NUNCA lo manda el cliente; lo saca el backend del JWT.

## Estado actual (2026-10-14) — estructura heredada
```
src/app/
  Core/services/   gemini.service.ts (⚠ key hardcodeada, sin commit), hallazgos.service.ts,
                   camera.service.ts; auth/chat/almanac.service.ts VACÍOS
  Core/guards/     auth.guard.ts VACÍO
  auth/            login/register VACÍOS
  features/camera/ camera, preview, results, analysis-view
  features/chat/   chat
  features/almanac/ almanac-list, almanac-detail (detalle duplica la lógica del chat)
  features/gamification/ VACÍOS
  settings/        legal (ok), settings VACÍO
  accesibilidad/   componente+servicio de accesibilidad (gris, invertir, voz, fuente)
  shared/models/   analysis-result, chat-message; user/discovery VACÍOS
```
Problemas conocidos: datos entre pantallas vía `router state` (se pierden con F5); rutas de
auth comentadas; `AppRoutingModule` NgModule sobrante; `AnalysisResult` duplicado;
`nivelConfianza` string vs int en backend; API URL hardcodeada `https://localhost:44312`.

## Arquitectura objetivo (feature-based / vertical)
```
src/app/
  core/        auth (service, guard, interceptor JWT), api (config, error handler), layout (shell)
  shared/      ui (tarjeta-coleccionable, botones...), accesibilidad, pipes, models comunes
  features/
    auth/        login, registro
    microscope/  cámara + zoom + linterna + captura + preview
    discovery/   resultado de análisis + chat IA
    almanac/     colección de tarjetas + detalle
    profile/     nivel, medallas, ajustes
  app.routes.ts  lazy loading por feature (loadChildren / loadComponent)
```
Convenciones: carpetas en minúscula kebab-case; cada feature tiene `data-access/` (servicio +
estado con signals), `ui/` (presentacionales) y páginas; nada de pasar datos por router state.

## Bitácora de cambios
- 2026-10-14: creado este archivo. Análisis inicial de front y back. Plan aprobado pendiente.
