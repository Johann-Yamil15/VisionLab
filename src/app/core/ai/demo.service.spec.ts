import { TestBed } from '@angular/core/testing';
import { ETIQUETAS_IA } from '../../shared/utils/tipos';
import { ANALISIS_DEMO } from './demo-data';
import { DemoService } from './demo.service';

describe('Modo demo', () => {
  it('tiene entre 5 y 6 fichas completas con categorías válidas', () => {
    expect(ANALISIS_DEMO.length).toBeGreaterThanOrEqual(5);
    expect(ANALISIS_DEMO.length).toBeLessThanOrEqual(6);
    for (const a of ANALISIS_DEMO) {
      expect(ETIQUETAS_IA).toContain(a.tipo);
      for (const campo of ['nombreComun', 'descripcion', 'habitat', 'alimentacion', 'colores', 'tamano', 'lema', 'amenazas', 'impactoEcologico', 'peligro'] as const) {
        expect(a[campo]).withContext(`${a.nombreComun}.${campo}`).toBeTruthy();
      }
      // Con confianza baja deben venir las 3 opciones; con confianza alta, ninguna.
      expect(a.opciones?.length).toBe(a.nivelConfianza < 60 ? 3 : 0);
    }
  });

  it('recorre los escaneos en orden y da la vuelta', () => {
    const demo = TestBed.inject(DemoService);
    const nombres = ANALISIS_DEMO.map(() => demo.siguienteAnalisis().nombreComun);
    expect(nombres).toEqual(ANALISIS_DEMO.map((a) => a.nombreComun));
    expect(demo.siguienteAnalisis().nombreComun).toBe(ANALISIS_DEMO[0].nombreComun);
  });

  it('responde al chat con los datos de la ficha', () => {
    const demo = TestBed.inject(DemoService);
    const mariquita = ANALISIS_DEMO.find((a) => a.nombreComun === 'Mariquita')!;
    expect(demo.responder(mariquita, '¿Qué come?')).toContain('pulgones');
    expect(demo.responder(mariquita, '¿Dónde vive?')).toContain('jardines');
  });
});
