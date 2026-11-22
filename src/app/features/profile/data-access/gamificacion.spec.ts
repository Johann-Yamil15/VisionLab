import { Hallazgo } from '../../../shared/models/hallazgo.model';
import { Medalla } from '../../../shared/models/perfil.model';
import { coleccion, siguientesRetos } from './gamificacion';

const h = (id: string, tipo: string, nombreCientifico: string): Hallazgo => ({
  id,
  usuarioId: 'u',
  tipo,
  nombreComun: nombreCientifico,
  nombreCientifico,
  descripcion: '',
  nivelConfianza: 90,
  fechaCaptura: `2026-10-0${id}T00:00:00Z`,
});

const m = (id: string, progreso: number, meta: number): Medalla => ({
  id,
  nombre: id,
  reto: '',
  meta,
  progreso,
  desbloqueada: progreso >= meta,
  imagen: '',
  gris: false,
  puntos: 0,
});

describe('gamificación del perfil', () => {
  it('destaca primero los retos pendientes más avanzados', () => {
    const lista = [m('hola', 1, 1), m('fauna', 2, 5), m('cientifico', 4, 5), m('investigador', 4, 10)];
    expect(siguientesRetos(lista).map((r) => r.id)).toEqual(['cientifico', 'fauna', 'investigador']);
  });

  it('arma la colección con las categorías con más especies primero', () => {
    const filas = coleccion([h('1', 'Insectos', 'A'), h('2', 'Insectos', 'B'), h('3', 'Hongos', 'C')]);
    expect(filas.length).toBe(6);
    expect(filas[0]).toEqual(jasmine.objectContaining({ especies: 2 }));
    expect(filas[0].tipo.clave).toBe('insecto');
  });
});
