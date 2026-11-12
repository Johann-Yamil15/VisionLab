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
| **Microscopio** | Lente circular con retícula. Zoom con los dedos, con botones o con barra (usa el zoom real del teléfono si lo tiene). Linterna, captura de lo que se ve en el zoom o subir una foto desde la galería. |
| **Vista previa** | Revisar la foto, repetirla o mandarla a analizar (animación de escaneo mientras la IA observa). |
| **Descubrimiento** | La IA dice qué es y lo clasifica en una de **12 categorías**. Aparece su **carta coleccionable** con nombre común y científico, descripción, confianza de la IA, datos rápidos y una frase divertida. Se guarda sola en el almanaque y muestra los puntos ganados. |
| **Asistente experto** | Chat con preguntas sugeridas ("¿Qué come?", "¿Dónde vive?", "Dato curioso"). Solo responde sobre esa especie. |
| **Almanaque** | Colección de cartas con filtros por categoría y buscador. Las especies repetidas se agrupan en una sola carta con "×2". |
| **Detalle de la carta** | Carta completa, resumen, **datos rápidos** (hábitat, alimentación, colores, tamaño), seguridad de la IA, otras veces que se encontró, chat y opción de quitar la carta. La foto se **amplía a pantalla completa con zoom** (pellizco, rueda, doble toque). |
| **Perfil** | Portada con su nivel y XP, puntos, descubrimientos, **medallas** (bloqueadas y desbloqueadas), **siguientes retos** con su progreso y **colección por categoría**. |
| **Accesibilidad** | Cambiar el tamaño del texto, usar escala de grises, invertir colores, activar una línea guía de lectura y lectura en voz alta. |
| **Acerca de** | Información del proyecto y del equipo. |

### Cartas coleccionables: 12 categorías
Cada categoría tiene su propio diseño de carta: **Insectos, Plantas, Vida acuática, Tierra y suelos,
Rocas y minerales, Metales y materiales, Aves y cielo, Luz y fenómenos, Hongos, Microscópico,
Objetos y Química**. La IA está obligada a elegir una de ellas, así cada hallazgo recibe su carta.

### Gamificación (reglas actuales)
- Cada hallazgo da **10 puntos + 1 por cada 10 % de confianza** de la IA.
- **Niveles:** Novato (0) → Explorador (500) → Investigador (1200) → Científico (2500) → Gran científico (5000).
- **Medallas:**

| Medalla | Cómo se gana |
|---|---|
| ¡Hola, explorador! | Primer descubrimiento |
| Ojos curiosos | 5 descubrimientos |
| Pequeño investigador | 10 especies diferentes |
| Amigo de la fauna | 5 animales (insectos, aves o vida acuática) |
| Científico en acción | 5 categorías distintas |

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

## Estado actual de la funcionalidad (2026-11-11)

| Función | Estado |
|---|---|
| Cámara, captura, zoom, linterna y galería | ✅ Funciona (zoom de hardware si el teléfono lo soporta; si no, digital) |
| Análisis con IA | ⚠️ Prompt y esquema listos (12 categorías + datos rápidos); pausado hasta pasar Gemini al backend con la llave nueva |
| Chat experto | ⚠️ Igual que el análisis |
| Guardado automático en el almanaque | ✅ Funciona |
| Almanaque: listar, filtrar, buscar, detalle, borrar | ✅ Funciona; el detalle tiene URL propia (sirve con F5) |
| Cartas con diseño por categoría | ✅ 12 diseños |
| Visor de foto con zoom | ✅ Funciona |
| Perfil (nivel, medallas, retos, colección) | ✅ Funciona; por ahora el progreso se calcula en la app (falta guardarlo en el servidor) |
| Calidad de fotos | 🟡 Se guardan a 1280 px dentro de la base; plan: original + miniatura en GridFS |
| Registro e inicio de sesión | ⚠️ El endpoint existe pero sin cifrado ni token; pantallas pendientes |
| Varios usuarios | ❌ Hoy todos los hallazgos quedan a nombre de un usuario demo |
| Tarjetas sin duplicados | 🟡 Se agrupan al mostrar (×N); falta hacerlo en el servidor |
| Accesibilidad | ✅ Funciona |

### Flujo principal
1. **Microscopio** → el niño captura o sube una foto.
2. **Vista previa** → "Analizar".
3. La IA responde en JSON con esquema fijo: `tipo` (una de las 12 categorías), `nombreComun`,
   `nombreCientifico`, `descripcion`, `nivelConfianza` (0–100), `habitat`, `alimentacion`,
   `colores`, `tamano` y `lema`.
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
Johann, Guillermo, Jesus.
