import { agruparPorEspecie } from '../../../shared/data-access/hallazgos.service';
import { Hallazgo } from '../../../shared/models/hallazgo.model';
import { Medalla } from '../../../shared/models/perfil.model';
import { imagenSrc } from '../../../shared/utils/imagen';
import { normalizarTipo, TipoInfo, todosLosTipos } from '../../../shared/utils/tipos';

// Niveles, puntos y medallas vienen del backend (GET /api/usuarios). Aquí solo queda lo que es
// de presentación: qué retos destacar y la colección por categoría.

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
