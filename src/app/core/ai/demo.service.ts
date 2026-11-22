import { Injectable, signal } from '@angular/core';
import { AnalysisResult, Especie } from '../../shared/models/hallazgo.model';
import { ANALISIS_DEMO } from './demo-data';

const STORAGE_KEY = 'visionlab.demo';

/**
 * Modo demo: responde con escaneos precargados, sin llamar a la IA (por si el CLI o la red
 * fallan en el museo). Se activa abriendo la app con `?demo=1` y se apaga con `?demo=0`;
 * la elección se recuerda en este navegador.
 */
@Injectable({ providedIn: 'root' })
export class DemoService {
  readonly activo = signal(this.leerInicial());
  private indice = 0;

  /** Siguiente escaneo precargado (da la vuelta al llegar al final). */
  siguienteAnalisis(): AnalysisResult {
    const analisis = ANALISIS_DEMO[this.indice % ANALISIS_DEMO.length];
    this.indice++;
    return structuredClone(analisis);
  }

  /** Respuesta del "experto" armada con los datos de la ficha. */
  responder(especie: Especie, pregunta: string): string {
    const p = pregunta.toLowerCase();
    const nombre = especie.nombreComun;
    const habitat = especie.habitat;
    const alimentacion = especie.alimentacion;

    if (/com(e|er|en)\b|aliment/.test(p) && alimentacion) return `${nombre} se alimenta de: ${alimentacion.toLowerCase()}.`;
    if (/(d[oó]nde|vive|habita|encuentra)/.test(p) && habitat) return `${nombre} se encuentra en: ${habitat.toLowerCase()}.`;
    if (/(peligro|veneno|muerde|ataca)/.test(p)) {
      const nivel = (especie as AnalysisResult).peligro;
      return `${nivel ? `Su nivel de peligro es ${nivel.toLowerCase()}. ` : ''}Observa siempre de lejos y pregúntale a un adulto antes de tocar.`;
    }
    if (/(curios|dato)/.test(p) && especie.lema) return `Dato curioso: ${especie.lema} ${especie.descripcion.split('. ')[0]}.`;
    return `${especie.descripcion.split('. ')[0]}. ¿Quieres saber qué come o dónde vive?`;
  }

  private leerInicial(): boolean {
    try {
      const param = new URLSearchParams(location.search).get('demo');
      if (param === '1' || param === '0') localStorage.setItem(STORAGE_KEY, param);
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false; // sin almacenamiento o fuera del navegador: modo normal
    }
  }
}
