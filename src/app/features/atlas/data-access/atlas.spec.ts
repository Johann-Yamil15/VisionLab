import { Hallazgo } from '../../../shared/models/hallazgo.model';
import { ElementoAtlas, elementosPersonales } from './atlas';

const CATALOGO = [{ id: 'jaguar', nombre: 'Jaguar', nombreCientifico: 'Panthera onca' }] as ElementoAtlas[];

const hallazgo = (extra: Partial<Hallazgo>): Hallazgo => ({
  id: 'h1',
  usuarioId: 'u1',
  tipo: 'Insectos',
  nombreComun: 'Mariquita',
  nombreCientifico: 'Coccinellidae',
  descripcion: 'Un escarabajo rojo con puntos.',
  nivelConfianza: 90,
  imagenBase64: 'AAAA',
  fechaCaptura: '2026-11-20T10:00:00Z',
  grupoAtlas: 'fauna',
  region: 'Europa y América',
  latitud: 48,
  longitud: 10,
  ...extra,
});

describe('elementosPersonales (Atlas personal)', () => {
  it('convierte una especie ubicada en un elemento propio, sin modelo', () => {
    const [e] = elementosPersonales([hallazgo({})], CATALOGO);

    expect(e).toEqual(
      jasmine.objectContaining({
        id: 'mi-coccinellidae',
        nombre: 'Mariquita',
        categoria: 'fauna',
        lat: 48,
        lng: 10,
        region: 'Europa y América',
        propio: true,
        modelo: '',
        sonido: '',
        puntos: [],
      }),
    );
    expect(e.miniatura).toBe('data:image/jpeg;base64,AAAA');
  });

  it('omite lo que no se pudo ubicar (objetos y hallazgos anteriores a esta función)', () => {
    const sinUbicacion = hallazgo({ id: 'h2', grupoAtlas: null, latitud: null, longitud: null });
    const sinCoordenadas = hallazgo({ id: 'h3', nombreComun: 'Rosa', nombreCientifico: 'Rosa', latitud: null });

    expect(elementosPersonales([sinUbicacion, sinCoordenadas], CATALOGO)).toEqual([]);
  });

  it('omite las especies que ya están en el catálogo fijo (ya tienen pin y modelo)', () => {
    const jaguar = hallazgo({ id: 'h4', nombreComun: 'Jaguar', nombreCientifico: 'Panthera onca', grupoAtlas: 'fauna' });
    expect(elementosPersonales([jaguar], CATALOGO)).toEqual([]);
  });

  it('una sola entrada por especie, con la foto de la captura más reciente y su ubicación', () => {
    const vieja = hallazgo({ id: 'a', fechaCaptura: '2026-11-01T00:00:00Z', imagenBase64: 'VIEJA' });
    const nueva = hallazgo({ id: 'b', fechaCaptura: '2026-11-22T00:00:00Z', imagenBase64: 'NUEVA' });
    const nuevaSinUbicacion = hallazgo({
      id: 'c', fechaCaptura: '2026-11-23T00:00:00Z', imagenBase64: 'SINUBI', grupoAtlas: null, latitud: null, longitud: null,
    });

    const r = elementosPersonales([vieja, nueva, nuevaSinUbicacion], CATALOGO);
    expect(r.length).toBe(1);
    expect(r[0].miniatura).toBe('data:image/jpeg;base64,SINUBI'); // foto de la tarjeta (la más reciente)
    expect(r[0].lat).toBe(48); // la ubicación sale de la captura más reciente que la tiene
  });

  it('el id no cambia al volver a escanear la misma especie', () => {
    const a = elementosPersonales([hallazgo({ id: 'x1' })], CATALOGO)[0].id;
    const b = elementosPersonales([hallazgo({ id: 'x2' }), hallazgo({ id: 'x1' })], CATALOGO)[0].id;
    expect(a).toBe(b);
  });
});
