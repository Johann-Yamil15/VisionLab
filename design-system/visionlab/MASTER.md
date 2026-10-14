# Sistema de diseño "Explorador" — VisionLab (MASTER)

Fuente de verdad del diseño. Las páginas pueden tener ajustes en `pages/<pagina>.md`; si no
existen, se usa solo este archivo. Implementación: `src/styles/_tokens.scss`,
`_base.scss`, `_components.scss`.

## Dirección
- **Producto:** herramienta educativa para niños de 7 a 12 años, mobile-first.
- **Estilo:** *Claymorphism*: piezas que parecen de plastilina, con bordes gruesos de 3px
  (`--c-ink`), esquinas redondeadas (12/20/28px), sombra sólida abajo y brillo interior.
  Lúdico pero legible.
- **Evitar:** colores apagados, texto gris sobre gris, emojis como íconos, animaciones sin
  propósito, estética de "terminal / laboratorio oscuro" (la versión anterior).

## Color (tokens)
| Rol | Token | Valor |
|---|---|---|
| Acción principal (naturaleza) | `--c-primary` / `-strong` | #15803D / #166534 |
| Ciencia / información | `--c-secondary` / `-strong` | #2563EB / #1D4ED8 |
| Recompensas, captura | `--c-sun` / `-strong` | #F59E0B / #D97706 (texto oscuro encima) |
| Fondo | `--c-bg` | #F2FBF4 con puntitos tipo cuaderno |
| Superficie | `--c-surface` | #FFFFFF |
| Texto / secundario | `--c-text` / `--c-text-muted` | #0F2A1C / #46594E (7:1) |
| Peligro | `--c-danger` | #DC2626 |

**Colores por tipo de hallazgo** (marco de las tarjetas; todos ≥ 4.5:1 con texto blanco):
insecto #C2410C · hoja #15803D · planta #047857 · flor #BE185D · roca #57534E ·
hongo #7E22CE · rama #92400E · objeto #1D4ED8 · otro #0E7490.
La normalización del texto de la IA a estas categorías está en `shared/utils/tipos.ts`.

## Tipografía
- **Títulos:** Fredoka 500–700 (redonda y amigable).
- **Texto:** Nunito 400–800 (muy legible para lectores jóvenes).
- Escala: 13 / 15 / 16 (base) / 20 / 24 / 32 / 40 px. Line-height del texto: 1.55–1.7.

## Espaciado y layout
- Ritmo 4/8: 4, 8, 12, 16, 24, 32, 48, 64.
- Breakpoints: 640 (3 columnas en el almanaque), 768, 900 (dos columnas en descubrimiento y
  detalle), 1024 (la navegación pasa de barra inferior a riel lateral), 1100 (4 columnas).
- Ancho máximo del contenido: 1120px.

## Componentes base (clases globales)
`.page`, `.page-header`, `.clay`, `.btn` (`--primary`, `--secondary`, `--sun`, `--danger`,
`--lg`, `--icon`, `--block`), `.chip` (con `aria-pressed` y `--chip-color`), `.type-badge`,
`.meter`, `.empty-state`, `.alert`, `.spinner`, `.skeleton`, `.toast`, `.dialog`.
Componentes Angular: `app-species-card` (tarjeta coleccionable) y `app-expert-chat`.

## Íconos
Lucide (`lucide-angular`), un solo set con trazo uniforme. Todos se registran en
`shared/ui/icons.ts` (`AppIcons`). Los decorativos llevan `aria-hidden`; los botones que solo
tienen ícono llevan `aria-label`.

## Movimiento
- Tokens: `--dur-fast` 150ms, `--dur` 250ms, `--dur-slow` 400ms; `--ease-out` y
  `--ease-spring` (rebote suave).
- Botones: se "hunden" 3px al presionar. Tarjetas: entran escalonadas (40ms entre una y
  otra). Descubrimiento: la tarjeta aparece con un "pop".
- Siempre se respeta `prefers-reduced-motion`.

## Accesibilidad (obligatorio)
- Contraste AA, foco visible (3px azul), objetivos táctiles ≥ 44–48px.
- Enlace "Saltar al contenido", `aria-live` en el chat y en los estados de guardado, diálogo
  con `role="alertdialog"` que cierra con Escape.
- Menú de accesibilidad: tamaño de texto (12–24px), línea de lectura, escala de grises,
  invertir colores y lectura en voz alta.
