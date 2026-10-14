import { LucideIconData } from 'lucide-angular';
import { AppIcons } from '../ui/icons';

export type TipoClave =
  | 'insecto'
  | 'hoja'
  | 'planta'
  | 'flor'
  | 'roca'
  | 'hongo'
  | 'rama'
  | 'objeto'
  | 'otro';

export interface TipoInfo {
  clave: TipoClave;
  label: string;
  icon: LucideIconData;
  /** Variable CSS del color del tipo (ver styles/_tokens.scss). */
  color: string;
  /** Frase de respaldo para la tarjeta cuando la IA no dio un lema. */
  frase: string;
}

const TIPOS: Record<TipoClave, Omit<TipoInfo, 'clave'>> = {
  insecto: { label: 'Insecto', icon: AppIcons.Bug, color: 'var(--t-insecto)', frase: 'Pequeño explorador que cumple un gran papel en la naturaleza.' },
  hoja: { label: 'Hoja', icon: AppIcons.Leaf, color: 'var(--t-hoja)', frase: 'Una fábrica solar que convierte la luz en alimento.' },
  planta: { label: 'Planta', icon: AppIcons.Sprout, color: 'var(--t-planta)', frase: 'Da oxígeno, alimento y refugio a muchos seres vivos.' },
  flor: { label: 'Flor', icon: AppIcons.Flower2, color: 'var(--t-flor)', frase: 'Llena de color, ayuda a que nazcan nuevas plantas.' },
  roca: { label: 'Roca', icon: AppIcons.Mountain, color: 'var(--t-roca)', frase: 'Guarda millones de años de historia de la Tierra.' },
  hongo: { label: 'Hongo', icon: AppIcons.Umbrella, color: 'var(--t-hongo)', frase: 'Recicla la naturaleza y ayuda a que el suelo esté sano.' },
  rama: { label: 'Rama', icon: AppIcons.TreeDeciduous, color: 'var(--t-rama)', frase: 'Parte de un árbol que da casa a muchos animales.' },
  objeto: { label: 'Objeto', icon: AppIcons.Shapes, color: 'var(--t-objeto)', frase: 'Hecho por personas: ¡obsérvalo y piensa para qué sirve!' },
  otro: { label: 'Otro', icon: AppIcons.ScanSearch, color: 'var(--t-otro)', frase: 'Un misterio de la naturaleza por descubrir.' },
};

const REGLAS: [RegExp, TipoClave][] = [
  [/insect|bicho|escarabaj|mariquit|hormig|mariposa|arana/, 'insecto'],
  [/hoja/, 'hoja'],
  [/flor/, 'flor'],
  [/planta|hierba|pasto|cactus|arbol/, 'planta'],
  [/roca|piedra|mineral|cristal/, 'roca'],
  [/hongo|seta|champi/, 'hongo'],
  [/rama|corteza|madera|tronco/, 'rama'],
  [/objeto|artificial/, 'objeto'],
];

/**
 * La IA a veces escribe el tipo distinto ("insecto", "Insecto", "Objeto artificial").
 * Lo normalizamos a una categoría fija para filtros, colores e íconos.
 */
export function normalizarTipo(tipo: string | null | undefined): TipoClave {
  const t = (tipo ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return REGLAS.find(([re]) => re.test(t))?.[1] ?? 'otro';
}

export function tipoInfo(tipo: string | null | undefined): TipoInfo {
  const clave = normalizarTipo(tipo);
  return { clave, ...TIPOS[clave] };
}

export function todosLosTipos(): TipoInfo[] {
  return (Object.keys(TIPOS) as TipoClave[]).map((clave) => ({ clave, ...TIPOS[clave] }));
}
