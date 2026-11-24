import { buscarEnAtlas } from './atlas-match';

const ATLAS = [
  { id: 'jaguar', nombre: 'Jaguar', nombreCientifico: 'Panthera onca' },
  { id: 'nenufar-gigante', nombre: 'Nenúfar gigante', nombreCientifico: 'Victoria amazonica' },
  { id: 'amatista', nombre: 'Cuarzo amatista', nombreCientifico: '' },
  { id: 'oso-polar', nombre: 'Oso polar', nombreCientifico: 'Ursus maritimus' },
  { id: 'cuarzo-rosa', nombre: 'Cuarzo rosa', nombreCientifico: '', alias: ['cuarzo rosado', 'Rose quartz'] },
];

describe('buscarEnAtlas', () => {
  it('coincide por nombre científico aunque el común sea distinto', () => {
    expect(buscarEnAtlas(ATLAS, 'Tigre americano', 'panthera ONCA')?.id).toBe('jaguar');
  });

  it('coincide por nombre común sin acentos ni mayúsculas', () => {
    expect(buscarEnAtlas(ATLAS, 'NENUFAR gigante', '')?.id).toBe('nenufar-gigante');
  });

  it('coincide cuando uno de los nombres contiene al otro', () => {
    expect(buscarEnAtlas(ATLAS, 'Amatista', '')?.id).toBe('amatista');
  });

  it('coincide por alias (sinónimos) sin acentos ni mayúsculas', () => {
    expect(buscarEnAtlas(ATLAS, 'CUARZO ROSADO', '')?.id).toBe('cuarzo-rosa');
    expect(buscarEnAtlas(ATLAS, 'rose quartz', '')?.id).toBe('cuarzo-rosa');
  });

  it('un alias demasiado corto no coincide con todo', () => {
    expect(buscarEnAtlas([{ id: 'x', nombre: 'Zorro', nombreCientifico: '', alias: ['ok'] }], 'ok', '')).toBeUndefined();
  });

  it('no coincide con nombres demasiado cortos ni con lo que no está en el Atlas', () => {
    expect(buscarEnAtlas(ATLAS, 'Oso', '')).toBeUndefined();
    expect(buscarEnAtlas(ATLAS, 'Mariquita', 'Coccinellidae')).toBeUndefined();
  });

  it('no coincide con datos vacíos', () => {
    expect(buscarEnAtlas(ATLAS, '', '')).toBeUndefined();
    expect(buscarEnAtlas(ATLAS, null, undefined)).toBeUndefined();
  });
});
