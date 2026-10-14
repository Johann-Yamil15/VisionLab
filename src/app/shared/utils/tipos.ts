import { LucideIconData } from 'lucide-angular';
import { AppIcons } from '../ui/icons';

/** Las 12 categorías visuales de las cartas (+ "otro" de respaldo). */
export type TipoClave =
  | 'insecto'
  | 'planta'
  | 'agua'
  | 'tierra'
  | 'roca'
  | 'metal'
  | 'ave'
  | 'luz'
  | 'hongo'
  | 'micro'
  | 'objeto'
  | 'quimica'
  | 'otro';

/**
 * Posición (en % del alto de la carta) de cada espacio dibujado en el fondo.
 * Las imágenes no son idénticas, así que cada categoría puede ajustar las suyas.
 */
export interface CartaSlots {
  cabecera: [inicio: number, fin: number];
  ventana: [inicio: number, fin: number];
  pildora: [inicio: number, fin: number];
  filas: [inicio: number, fin: number];
  /** Número de filas que dibuja el fondo (3 o 4). */
  numFilas: number;
}

export interface TipoInfo {
  clave: TipoClave;
  label: string;
  icon: LucideIconData;
  /** Variable CSS del color de la categoría (chips y etiquetas). */
  color: string;
  /** Imagen de fondo de la carta (public/cards). */
  fondo: string;
  /** La cabecera del fondo es clara → el nombre va en texto oscuro. */
  cabeceraClara: boolean;
  slots: CartaSlots;
  /** Frase de respaldo cuando la IA no dio un lema. */
  frase: string;
}

const SLOTS_BASE: CartaSlots = {
  cabecera: [2, 8.6],
  ventana: [9.8, 44.6],
  pildora: [46, 51.2],
  filas: [53, 73.6],
  numFilas: 3,
};

const SLOTS_ALTOS: CartaSlots = {
  cabecera: [1.6, 6.8],
  ventana: [7.8, 42.2],
  pildora: [43.6, 48.6],
  filas: [50, 72.6],
  numFilas: 3,
};

type Def = Omit<TipoInfo, 'clave' | 'fondo' | 'slots'> & { slots?: CartaSlots };

const TIPOS: Record<TipoClave, Def> = {
  insecto: {
    label: 'Insectos',
    icon: AppIcons.Bug,
    color: 'var(--t-insecto)',
    cabeceraClara: false,
    frase: 'Pequeño explorador que cumple un gran papel en la naturaleza.',
  },
  planta: {
    label: 'Plantas',
    icon: AppIcons.Sprout,
    color: 'var(--t-planta)',
    cabeceraClara: true,
    frase: 'Da oxígeno, alimento y refugio a muchos seres vivos.',
    slots: { cabecera: [2.6, 9.4], ventana: [11.2, 46.4], pildora: [47.4, 53.5], filas: [56, 75.8], numFilas: 4 },
  },
  agua: {
    label: 'Vida acuática',
    icon: AppIcons.Fish,
    color: 'var(--t-agua)',
    cabeceraClara: true,
    frase: 'El agua es el hogar de seres sorprendentes.',
    slots: SLOTS_ALTOS,
  },
  tierra: {
    label: 'Tierra y suelos',
    icon: AppIcons.Shovel,
    color: 'var(--t-tierra)',
    cabeceraClara: false,
    frase: 'Bajo tus pies vive un mundo lleno de vida.',
  },
  roca: {
    label: 'Rocas y minerales',
    icon: AppIcons.Gem,
    color: 'var(--t-roca)',
    cabeceraClara: true,
    frase: 'Guarda millones de años de historia de la Tierra.',
  },
  metal: {
    label: 'Metales y materiales',
    icon: AppIcons.Magnet,
    color: 'var(--t-metal)',
    cabeceraClara: true,
    frase: 'Los materiales construyen el mundo que nos rodea.',
    slots: SLOTS_ALTOS,
  },
  ave: {
    label: 'Aves y cielo',
    icon: AppIcons.Bird,
    color: 'var(--t-ave)',
    cabeceraClara: true,
    frase: 'Mira hacia arriba: el cielo también está lleno de vida.',
  },
  luz: {
    label: 'Luz y fenómenos',
    icon: AppIcons.Rainbow,
    color: 'var(--t-luz)',
    cabeceraClara: true,
    frase: 'La luz y la naturaleza crean espectáculos increíbles.',
  },
  hongo: {
    label: 'Hongos',
    icon: AppIcons.Umbrella,
    color: 'var(--t-hongo)',
    cabeceraClara: false,
    frase: 'Recicla la naturaleza y ayuda a que el suelo esté sano.',
  },
  micro: {
    label: 'Microscópico',
    icon: AppIcons.Microscope,
    color: 'var(--t-micro)',
    cabeceraClara: false,
    frase: 'Hay mundos enteros que solo se ven con lupa.',
  },
  objeto: {
    label: 'Objetos',
    icon: AppIcons.Cpu,
    color: 'var(--t-objeto)',
    cabeceraClara: true,
    frase: 'Hecho por personas: ¡obsérvalo y piensa para qué sirve!',
  },
  quimica: {
    label: 'Química',
    icon: AppIcons.FlaskConical,
    color: 'var(--t-quimica)',
    cabeceraClara: false,
    frase: 'Todo lo que existe está hecho de sustancias asombrosas.',
  },
  otro: {
    label: 'Otro',
    icon: AppIcons.ScanSearch,
    color: 'var(--t-otro)',
    cabeceraClara: false,
    frase: 'Un misterio de la naturaleza por descubrir.',
  },
};

/** Fondo de cada categoría; "otro" reutiliza el del mundo microscópico. */
const FONDO: Record<TipoClave, string> = {
  insecto: 'cards/insecto.webp',
  planta: 'cards/planta.webp',
  agua: 'cards/agua.webp',
  tierra: 'cards/tierra.webp',
  roca: 'cards/roca.webp',
  metal: 'cards/metal.webp',
  ave: 'cards/ave.webp',
  luz: 'cards/luz.webp',
  hongo: 'cards/hongo.webp',
  micro: 'cards/micro.webp',
  objeto: 'cards/objeto.webp',
  quimica: 'cards/quimica.webp',
  otro: 'cards/micro.webp',
};

/** El orden importa: la primera regla que coincide gana. */
const REGLAS: [RegExp, TipoClave][] = [
  [/insect|artropod|arana|bicho|escarab|mariquit|hormig|mariposa|abeja|grillo|ciempies|cochinilla|mosca|oruga/, 'insecto'],
  [/hongo|seta|champi|liquen|moho/, 'hongo'],
  [/microsc|celula|bacteria|microb|polen|protozo/, 'micro'],
  [/acuatic|\bagua\b|pez|peces|rana|renacuajo|alga|concha|caracol/, 'agua'],
  [/\bave\b|\baves\b|pajaro|pluma|nido|cielo|nube/, 'ave'],
  [/planta|flor|hoja|rama|arbol|hierba|pasto|cactus|semilla|tronco|corteza|madera|musgo|flora/, 'planta'],
  [/roca|piedra|mineral|cristal|fosil|gema/, 'roca'],
  [/tierra|suelo|arena|lodo|barro|composta/, 'tierra'],
  [/metal|material|plastico|vidrio|tela|papel|carton/, 'metal'],
  [/\bluz\b|fenomeno|arcoiris|sombra|reflejo|\bsol\b/, 'luz'],
  [/quimic|sustancia|\bsal\b|azucar|liquido/, 'quimica'],
  [/objeto|artificial|tecnolog|juguete|herramienta/, 'objeto'],
];

/**
 * La IA a veces escribe el tipo distinto ("insecto", "Insecto", "Objeto artificial").
 * Lo normalizamos a una categoría fija para filtros, colores, fondos e íconos.
 */
export function normalizarTipo(tipo: string | null | undefined): TipoClave {
  const t = (tipo ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return REGLAS.find(([re]) => re.test(t))?.[1] ?? 'otro';
}

function info(clave: TipoClave): TipoInfo {
  const { slots, ...def } = TIPOS[clave];
  return { clave, ...def, fondo: FONDO[clave], slots: slots ?? SLOTS_BASE };
}

export function tipoInfo(tipo: string | null | undefined): TipoInfo {
  return info(normalizarTipo(tipo));
}

export function todosLosTipos(): TipoInfo[] {
  return (Object.keys(TIPOS) as TipoClave[]).map(info);
}

/** Nombres de categoría que se le piden a la IA. */
export const CATEGORIAS_IA = (Object.keys(TIPOS) as TipoClave[])
  .filter((c) => c !== 'otro')
  .map((c) => TIPOS[c].label)
  .join(', ');
