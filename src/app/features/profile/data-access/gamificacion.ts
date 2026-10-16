import { agruparPorEspecie } from '../../../shared/data-access/hallazgos.service';
import { Hallazgo } from '../../../shared/models/hallazgo.model';
import { imagenSrc } from '../../../shared/utils/imagen';
import { normalizarTipo, TipoClave, TipoInfo, todosLosTipos } from '../../../shared/utils/tipos';

// Catálogo de niveles y medallas.
// TEMPORAL: las colecciones `niveles` y `logros` del backend están vacías, así que el progreso
// se calcula aquí con los hallazgos. Cuando el backend las tenga (con los mismos valores),
// el perfil debe leerlas de la API y este archivo se elimina.

export interface Nivel {
  numero: number;
  titulo: string;
  desde: number;
}

export const NIVELES: Nivel[] = [
  { numero: 1, titulo: 'Novato', desde: 0 },
  { numero: 2, titulo: 'Explorador', desde: 500 },
  { numero: 3, titulo: 'Investigador', desde: 1200 },
  { numero: 4, titulo: 'Científico', desde: 2500 },
  { numero: 5, titulo: 'Gran científico', desde: 5000 },
];

export interface ProgresoNivel {
  actual: Nivel;
  siguiente: Nivel | null;
  /** 0–100, avance dentro del nivel actual. */
  porcentaje: number;
  faltan: number;
}

export function progresoNivel(puntos: number): ProgresoNivel {
  const actual = [...NIVELES].reverse().find((n) => puntos >= n.desde) ?? NIVELES[0];
  const siguiente = NIVELES.find((n) => n.desde > puntos) ?? null;
  if (!siguiente) return { actual, siguiente, porcentaje: 100, faltan: 0 };

  const tramo = siguiente.desde - actual.desde;
  return {
    actual,
    siguiente,
    porcentaje: Math.round(((puntos - actual.desde) / tramo) * 100),
    faltan: siguiente.desde - puntos,
  };
}

/** Datos del niño que usan las medallas. */
export interface Estadisticas {
  /** Hallazgos totales (contador del perfil, incluye los borrados). */
  total: number;
  especies: number;
  categorias: number;
  /** Especies de animales: insectos, aves y vida acuática. */
  fauna: number;
}

const FAUNA: TipoClave[] = ['insecto', 'ave', 'agua'];

export function estadisticas(hallazgos: Hallazgo[], totalPerfil: number): Estadisticas {
  const grupos = agruparPorEspecie(hallazgos);
  const tipos = grupos.map((g) => normalizarTipo(g.principal.tipo));
  return {
    total: Math.max(totalPerfil, hallazgos.length),
    especies: grupos.length,
    categorias: new Set(tipos.filter((t) => t !== 'otro')).size,
    fauna: tipos.filter((t) => FAUNA.includes(t)).length,
  };
}

interface DefMedalla {
  id: string;
  nombre: string;
  reto: string;
  meta: number;
  valor: (e: Estadisticas) => number;
  imagen: string;
  /** Imagen plateada con candado; si no hay, se usa la dorada en gris. */
  imagenBloqueada?: string;
}

const MEDALLAS: DefMedalla[] = [
  {
    id: 'hola-explorador',
    nombre: '¡Hola, explorador!',
    reto: 'Descubre tu primer elemento en VisionLab.',
    meta: 1,
    valor: (e) => e.total,
    imagen: 'profile/medalla-hola-explorador.webp',
  },
  {
    id: 'ojos-curiosos',
    nombre: 'Ojos curiosos',
    reto: 'Descubre 5 elementos en total.',
    meta: 5,
    valor: (e) => e.total,
    imagen: 'profile/medalla-ojos-curiosos.webp',
  },
  {
    id: 'pequeno-investigador',
    nombre: 'Pequeño investigador',
    reto: 'Descubre 10 elementos diferentes.',
    meta: 10,
    valor: (e) => e.especies,
    imagen: 'profile/medalla-investigador.webp',
    imagenBloqueada: 'profile/medalla-investigador-bloqueada.webp',
  },
  {
    id: 'amigo-fauna',
    nombre: 'Amigo de la fauna',
    reto: 'Descubre 5 animales: insectos, aves o vida acuática.',
    meta: 5,
    valor: (e) => e.fauna,
    imagen: 'profile/medalla-fauna.webp',
    imagenBloqueada: 'profile/medalla-fauna-bloqueada.webp',
  },
  {
    id: 'cientifico-accion',
    nombre: 'Científico en acción',
    reto: 'Explora 5 categorías distintas.',
    meta: 5,
    valor: (e) => e.categorias,
    imagen: 'profile/medalla-cientifico.webp',
    imagenBloqueada: 'profile/medalla-cientifico-bloqueada.webp',
  },
];

export interface Medalla {
  id: string;
  nombre: string;
  reto: string;
  meta: number;
  progreso: number;
  desbloqueada: boolean;
  imagen: string;
  /** La imagen no tiene versión bloqueada propia: se muestra en gris con candado. */
  gris: boolean;
}

export function medallas(e: Estadisticas): Medalla[] {
  return MEDALLAS.map((m) => {
    const progreso = Math.min(m.meta, m.valor(e));
    const desbloqueada = progreso >= m.meta;
    return {
      id: m.id,
      nombre: m.nombre,
      reto: m.reto,
      meta: m.meta,
      progreso,
      desbloqueada,
      imagen: desbloqueada ? m.imagen : (m.imagenBloqueada ?? m.imagen),
      gris: !desbloqueada && !m.imagenBloqueada,
    };
  });
}

/** Los 3 retos a mostrar: primero los pendientes más avanzados; si faltan, los completados. */
export function siguientesRetos(lista: Medalla[]): Medalla[] {
  const avance = (m: Medalla) => m.progreso / m.meta;
  const pendientes = lista.filter((m) => !m.desbloqueada).sort((a, b) => avance(b) - avance(a));
  return [...pendientes, ...lista.filter((m) => m.desbloqueada)].slice(0, 3);
}

export const META_COLECCION = 10;

export interface FilaColeccion {
  tipo: TipoInfo;
  especies: number;
  /** Foto más reciente de esa categoría (o null para mostrar el ícono). */
  foto: string | null;
}

/** Especies por categoría; las que más tiene primero, completando hasta `limite` filas. */
export function coleccion(hallazgos: Hallazgo[], limite = 6): FilaColeccion[] {
  const grupos = agruparPorEspecie(hallazgos);
  return todosLosTipos()
    .filter((t) => t.clave !== 'otro')
    .map((tipo) => {
      const propios = grupos.filter((g) => normalizarTipo(g.principal.tipo) === tipo.clave);
      const conFoto = propios.find((g) => g.principal.imagenBase64);
      return { tipo, especies: propios.length, foto: imagenSrc(conFoto?.principal.imagenBase64) };
    })
    .sort((a, b) => b.especies - a.especies)
    .slice(0, limite);
}
