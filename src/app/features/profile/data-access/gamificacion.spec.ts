import { Hallazgo } from '../../../shared/models/hallazgo.model';
import { coleccion, estadisticas, medallas, progresoNivel, siguientesRetos } from './gamificacion';

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

describe('gamificación del perfil', () => {
  it('calcula el nivel y lo que falta para el siguiente', () => {
    expect(progresoNivel(257)).toEqual(
      jasmine.objectContaining({ porcentaje: 51, faltan: 243 }),
    );
    expect(progresoNivel(257).actual.titulo).toBe('Novato');
    expect(progresoNivel(500).actual.titulo).toBe('Explorador');
    expect(progresoNivel(9999)).toEqual(jasmine.objectContaining({ siguiente: null, porcentaje: 100 }));
  });

  it('cuenta especies distintas, categorías y fauna', () => {
    const lista = [
      h('1', 'Insectos', 'Coccinella septempunctata'),
      h('2', 'insecto', 'coccinella septempunctata'), // misma especie
      h('3', 'Aves y cielo', 'Passer domesticus'),
      h('4', 'Hoja', 'Quercus robur'),
    ];
    expect(estadisticas(lista, 6)).toEqual({ total: 6, especies: 3, categorias: 3, fauna: 2 });
  });

  it('desbloquea medallas y ordena los retos', () => {
    const lista = medallas({ total: 6, especies: 3, categorias: 3, fauna: 2 });
    expect(lista.filter((m) => m.desbloqueada).map((m) => m.id)).toEqual(['hola-explorador', 'ojos-curiosos']);
    expect(siguientesRetos(lista)[0].id).toBe('cientifico-accion'); // 3/5 es el más avanzado
    expect(lista.find((m) => m.id === 'ojos-curiosos')?.gris).toBeFalse();
    expect(lista.find((m) => m.id === 'amigo-fauna')?.imagen).toContain('bloqueada');
  });

  it('arma la colección con las categorías con más especies primero', () => {
    const filas = coleccion([h('1', 'Insectos', 'A'), h('2', 'Insectos', 'B'), h('3', 'Hongos', 'C')]);
    expect(filas.length).toBe(6);
    expect(filas[0]).toEqual(jasmine.objectContaining({ especies: 2 }));
    expect(filas[0].tipo.clave).toBe('insecto');
  });
});
