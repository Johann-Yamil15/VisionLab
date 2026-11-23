export interface Nivel {
  numero: number;
  titulo: string;
  /** Puntos con los que empieza el nivel. */
  desde: number;
}

export interface ProgresoNivel {
  actual: Nivel;
  siguiente: Nivel | null;
  /** 0–100, avance dentro del nivel actual. */
  porcentaje: number;
  faltan: number;
}

/** Medalla lista para mostrar: `imagen` ya es la dorada o la bloqueada según el estado. */
export interface Medalla {
  id: string;
  nombre: string;
  reto: string;
  meta: number;
  progreso: number;
  desbloqueada: boolean;
  imagen: string;
  /** No tiene imagen bloqueada propia: se muestra la dorada en gris con candado. */
  gris: boolean;
  /** Puntos extra que da al desbloquearse. */
  puntos: number;
}

/** Lo que se ganó al guardar un hallazgo (viene en la respuesta de POST /api/hallazgos). */
export interface Progreso {
  puntosGanados: number;
  medallasNuevas: Medalla[];
  nivelNuevo: Nivel | null;
  /** Capturas de esa especie contando la nueva; > 1 = repetida (0 XP). */
  veces?: number;
}

/** GET /api/usuarios */
export interface Perfil {
  id: string;
  nombreUsuario: string;
  puntos: number;
  hallazgosContador: number;
  nivelActual: string;
  nivel: ProgresoNivel;
  /** Hallazgos totales, incluidos los borrados. */
  descubrimientos: number;
  medallas: Medalla[];
}
