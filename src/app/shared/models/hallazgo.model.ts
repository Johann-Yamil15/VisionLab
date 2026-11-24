/** Datos rápidos opcionales (los hallazgos antiguos no los tienen). */
export interface DatosRapidos {
  habitat?: string | null;
  alimentacion?: string | null;
  colores?: string | null;
  tamano?: string | null;
  /** Frase corta y divertida para el pie de la tarjeta. */
  lema?: string | null;
}

/** Grupo del Atlas en el que aparece un hallazgo. */
export type GrupoAtlas = 'fauna' | 'flora' | 'mineral';

/**
 * Dónde vive la especie (no dónde se tomó la foto), para ubicarla en el Atlas personal.
 * Todo vacío si no aplica (objetos, fenómenos) o si el hallazgo es anterior a esta función.
 */
export interface UbicacionAtlas {
  grupoAtlas?: GrupoAtlas | null;
  region?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

/** Hallazgo guardado en el almanaque (GET /api/hallazgos). */
export interface Hallazgo extends DatosRapidos, UbicacionAtlas {
  /** Familia taxonómica del animal en latín ("Felidae"); vacía si no es un animal o es un hallazgo antiguo. */
  familia?: string | null;
  id: string;
  usuarioId: string;
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: number;
  imagenBase64?: string | null;
  fechaCaptura: string;
}

/** Identificación alternativa que ofrece la IA cuando no está segura. */
export interface OpcionAnalisis {
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
}

/** Resultado del análisis de la IA (POST /api/analisis). */
export interface AnalysisResult extends DatosRapidos, UbicacionAtlas {
  /** Familia taxonómica del animal en latín ("Felidae"); vacía si no es un animal. */
  familia?: string | null;
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: number;
  amenazas?: string | null;
  impactoEcologico?: string | null;
  /** "Bajo", "Medio" o "Alto". */
  peligro?: string | null;
  /** 3 identificaciones posibles; solo vienen con nivelConfianza < 60. */
  opciones?: OpcionAnalisis[];
}

/** Cuerpo de POST /api/hallazgos (el usuario lo pone el servidor). */
export interface NuevoHallazgo extends DatosRapidos, UbicacionAtlas {
  familia?: string | null;
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: number;
  imagenBase64?: string;
}

/** Datos mínimos para mostrar una tarjeta (sirve para análisis y para hallazgos guardados). */
export interface Especie extends DatosRapidos {
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: number;
}
