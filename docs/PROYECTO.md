# VisionLab — Microscopio digital para niños

## Descripción general

VisionLab es una aplicación web educativa que convierte el teléfono o la computadora en un
**microscopio digital con inteligencia artificial** para niños de 7 a 12 años.

El niño apunta la cámara a algo que encuentra en la naturaleza (un insecto, una hoja, una roca,
un hongo). La app le dice **qué es**, con su nombre común y científico y una explicación
adaptada a su edad. Después lo guarda como una **tarjeta coleccionable** en su almanaque
personal, y el niño puede **platicar con un asistente experto** para aprender más sobre ese
hallazgo. Cada descubrimiento suma **puntos, niveles y medallas** para motivar la exploración.

### Problema que resuelve
Muchos niños no tienen acceso a un microscopio ni a guías de campo. VisionLab aprovecha el
dispositivo que ya existe en casa o en la escuela para fomentar la **curiosidad científica**,
la **observación detallada** y el **aprendizaje activo**, sin saturar con texto.

### Público
- **Usuarios:** niños de 7 a 12 años (con apoyo de un adulto para crear la cuenta).
- **Contexto:** escuela, casa, salidas al parque o al campo. Uso principal en celular.
- **Presentación:** propuesta para el museo **El Rehilete (Pachuca, Hidalgo)**.

## Qué hace (funcionalidades)

| Módulo | Qué puede hacer el niño |
|---|---|
| **Microscopio** | Abrir la cámara (trasera en celular), acercar con zoom, encender la linterna si el equipo la tiene, capturar una foto o subirla desde la galería. |
| **Vista previa** | Revisar la foto, repetirla o mandarla a analizar. |
| **Descubrimiento** | Ver qué es (tipo, nombre común, nombre científico, descripción y nivel de confianza de la IA). El hallazgo se guarda solo en su almanaque. |
| **Asistente experto** | Hacer preguntas sobre ese hallazgo. Solo responde sobre esa especie (no se desvía a otros temas). |
| **Almanaque** | Ver su colección de tarjetas, filtrarlas por tipo (insecto, hoja, roca...), abrir el detalle y borrar una tarjeta. |
| **Perfil** | Ver sus puntos, su nivel y sus medallas. |
| **Accesibilidad** | Cambiar el tamaño del texto, usar escala de grises, invertir colores, activar una línea guía de lectura y lectura en voz alta. |
| **Acerca de** | Información del proyecto y del equipo. |

### Gamificación (reglas actuales)
- Cada hallazgo da **10 puntos + 1 por cada 10 % de confianza** de la IA.
- Las **medallas** se desbloquean por requisitos (ej.: 5 hallazgos totales) y dan puntos extra.
- El **nivel** depende de los puntos acumulados (ej.: Novato → Explorador → Científico).

## Alcance

### Incluido en la versión del concurso (meta 2026-10-29)
- Captura con zoom y linterna, análisis con IA (Gemini) y chat experto por hallazgo.
- Almanaque de tarjetas coleccionables por usuario, sin duplicados ("¡lo encontraste 2 veces!").
- Registro e inicio de sesión de varios niños sobre el mismo servidor (cada uno ve solo lo suyo).
- Puntos, niveles y medallas.
- Diseño infantil, accesible y usable en celular (instalable como app).
- Seguridad: la llave de la IA solo vive en el servidor; contraseñas cifradas.

### Fuera de alcance (por ahora)
- Modelos 3D y realidad aumentada (ej.: apuntar a una imagen y que aparezca una animación,
  como los billetes de lotería). Se evaluará si sobra tiempo.
- Modo sin conexión, panel para maestros, varios idiomas, apps nativas en tiendas.
- Identificación científica certificada: la IA puede equivocarse y la app lo indica con el
  nivel de confianza.

## Arquitectura (resumen)

```
Navegador (Angular 20)  ──HTTPS──►  VisionLab API (.NET 9)  ──►  MongoDB
                                        │
                                        └──►  Google Gemini (análisis de imagen y chat)
```

- **Frontend:** Angular 20, componentes standalone y signals, organizado por features
  (microscopio, descubrimiento, almanaque, perfil). Repo `VisionLab`.
- **Backend:** API REST monolítica en .NET 9 con Clean Architecture (Domain, Application,
  Infrastructure, Api) y casos de uso por feature. Sin estado: escala horizontalmente.
  Repo `VisionLab-API`.
- **Base de datos:** MongoDB (usuarios, hallazgos, logros, niveles).
- **IA:** Google Gemini 2.5 Flash.

## Estado actual de la funcionalidad (2026-10-14)

| Función | Estado |
|---|---|
| Cámara, captura, zoom, linterna y galería | ✅ Funciona (zoom de hardware si el teléfono lo soporta; si no, digital) |
| Análisis con IA | ⚠️ Pausado: la llave se quitó del navegador; se reactiva al pasar Gemini al backend |
| Chat experto | ⚠️ Igual que el análisis |
| Guardado automático en el almanaque | ✅ Funciona |
| Almanaque: listar, filtrar, buscar, detalle, borrar | ✅ Funciona; el detalle tiene URL propia (sirve con F5) |
| Perfil (puntos, nivel, medallas) | ✅ Pantalla nueva; faltan cargar medallas y niveles en la base |
| Registro e inicio de sesión | ⚠️ El endpoint existe pero sin cifrado ni token; pantallas pendientes |
| Varios usuarios | ❌ Hoy todos los hallazgos quedan a nombre de un usuario demo |
| Tarjetas sin duplicados | 🟡 Se agrupan al mostrar (×N); falta hacerlo en el servidor |
| Accesibilidad | ✅ Funciona |

### Flujo principal
1. **Microscopio** → el niño captura o sube una foto.
2. **Vista previa** → "Analizar".
3. La IA responde en JSON: `tipo`, `nombreComun`, `nombreCientifico`, `descripcion`,
   `nivelConfianza` (0–100).
4. **Descubrimiento** → se muestra la tarjeta y se guarda sola (`POST /api/hallazgos`); el
   servidor suma puntos y revisa medallas y nivel.
5. El niño puede chatear con el experto o ir a su **almanaque**.

### Endpoints que usa el frontend
| Método | Ruta | Uso |
|---|---|---|
| GET | /api/hallazgos | Almanaque |
| GET | /api/hallazgos/{id} | Detalle de una tarjeta |
| POST | /api/hallazgos | Guardar un descubrimiento |
| DELETE | /api/hallazgos/{id} | Borrar una tarjeta |
| GET | /api/usuarios | Perfil (puntos, nivel, medallas) |
| POST | /api/auth/register, /api/auth/login | Registro e inicio de sesión (pantallas pendientes) |

## Equipo
Johann, Guillermo, Joel y Miguel.
