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
}

const TIPOS: Record<TipoClave, Omit<TipoInfo, 'clave'>> = {
  insecto: { label: 'Insecto', icon: AppIcons.Bug, color: 'var(--t-insecto)' },
  hoja: { label: 'Hoja', icon: AppIcons.Leaf, color: 'var(--t-hoja)' },
  planta: { label: 'Planta', icon: AppIcons.Sprout, color: 'var(--t-planta)' },
  flor: { label: 'Flor', icon: AppIcons.Flower2, color: 'var(--t-flor)' },
  roca: { label: 'Roca', icon: AppIcons.Mountain, color: 'var(--t-roca)' },
  hongo: { label: 'Hongo', icon: AppIcons.Umbrella, color: 'var(--t-hongo)' },
  rama: { label: 'Rama', icon: AppIcons.TreeDeciduous, color: 'var(--t-rama)' },
  objeto: { label: 'Objeto', icon: AppIcons.Shapes, color: 'var(--t-objeto)' },
  otro: { label: 'Otro', icon: AppIcons.ScanSearch, color: 'var(--t-otro)' },
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
