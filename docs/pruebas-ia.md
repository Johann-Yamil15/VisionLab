# Pruebas de la IA y modo demo (OMNI-13)

## Modo demo (plan B para el museo)

Responde con 6 escaneos precargados, **sin llamar a la IA**, por si el CLI de Claude o la red fallan.

| Acción | Cómo |
|---|---|
| Activarlo | Abrir la app con `?demo=1` (p. ej. `https://…/microscopio?demo=1`). Se recuerda en ese navegador. |
| Apagarlo | Abrir con `?demo=0`. |
| Cómo se nota | Aviso amarillo "Modo demo" en la vista previa. |
| Qué devuelve | Jaguar, Nenúfar gigante y Cuarzo amatista (existen en el Atlas → aparece "Ver en el Atlas 3D"), Mariquita, Amanita muscaria y una hoja de roble con confianza baja (muestra las 3 opciones). Da la vuelta al llegar al final. |
| Chat | Responde con los datos de la ficha (qué come, dónde vive, peligro, dato curioso). |

Los datos están en `src/app/core/ai/demo-data.ts`. El guardado en el almanaque sí usa el backend y Mongo.

## Tabla de acierto por categoría (Tabla 2 del documento técnico)

**Procedimiento.** Con el backend corriendo y el CLI de Claude con sesión iniciada (modo demo apagado):

1. Reunir ≈4 fotos por categoría (50 en total). Fotos reales, como las tomaría un visitante.
2. Escanear cada una y anotar: categoría que devolvió la IA, nombre, confianza y si fue correcto.
3. Contar un acierto cuando **la categoría y el nombre común** son correctos (anotar aparte si solo acertó la categoría).
4. Anotar los fallos (503, tiempo > 20 s, JSON inválido) en la última columna; también cuentan.

| Categoría | Fotos | Aciertos (categoría) | Aciertos (nombre) | % acierto | Tiempo medio (s) | Fallos técnicos |
|---|---|---|---|---|---|---|
| Insectos | | | | | | |
| Plantas | | | | | | |
| Vida acuática | | | | | | |
| Tierra y suelos | | | | | | |
| Rocas y minerales | | | | | | |
| Metales y materiales | | | | | | |
| Aves y cielo | | | | | | |
| Luz y fenómenos | | | | | | |
| Hongos | | | | | | |
| Microscópico | | | | | | |
| Objetos | | | | | | |
| Química | | | | | | |
| **Total** | **50** | | | | | |

### Detalle por foto (opcional, para el jurado)

| # | Foto | Categoría esperada | Categoría IA | Nombre IA | Confianza | ¿Correcto? | Notas |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |

## Flujo completo a probar

Globo → 3D → puntos → escáner → colección:

- [ ] Atlas: el globo carga y se puede abrir un elemento (y su 3D).
- [ ] Escanear una foto → "análisis espectral" → ficha completa (peligro, amenazas, impacto).
- [ ] Confianza < 60 → aparecen 3 opciones y la elegida es la que se guarda en el almanaque.
- [ ] Se suman puntos al guardar y se ven en el perfil.
- [ ] Si lo identificado está en el Atlas, aparece "Ver en el Atlas 3D"; si no, no aparece.
- [ ] El chat del experto responde sobre la especie y rechaza preguntas fuera de tema.
- [ ] La tarjeta aparece en el almanaque.
- [ ] Con `?demo=1` todo lo anterior funciona **con el API de IA apagado**.
- [ ] Con el CLI caído y sin demo, se ve un mensaje amable (no una pantalla rota).
