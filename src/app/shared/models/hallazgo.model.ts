/** Hallazgo guardado en el almanaque (GET /api/hallazgos). */
export interface Hallazgo {
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

/** Resultado del análisis de la IA. */
export interface AnalysisResult {
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: number;
}

/** Cuerpo de POST /api/hallazgos (el usuario lo pone el servidor). */
export interface NuevoHallazgo extends AnalysisResult {
  imagenBase64?: string;
}

/** Datos mínimos para mostrar una tarjeta (sirve para análisis y para hallazgos guardados). */
export interface Especie {
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: number;
}
