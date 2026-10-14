import { Injectable, signal } from '@angular/core';
import { AnalysisResult } from '../../../shared/models/hallazgo.model';

const STORAGE_KEY = 'visionlab.captura';

interface CapturaState {
  foto: string | null;
  resultado: AnalysisResult | null;
  /** Id del hallazgo ya guardado, para no guardarlo dos veces si se recarga la página. */
  guardadoId: string | null;
}

const VACIO: CapturaState = { foto: null, resultado: null, guardadoId: null };

/**
 * Estado del flujo captura → vista previa → descubrimiento.
 * Se respalda en sessionStorage para sobrevivir a un F5 (antes se perdía con el router state).
 */
@Injectable({ providedIn: 'root' })
export class CapturaStore {
  private readonly state = signal<CapturaState>(this.leer());

  readonly foto = () => this.state().foto;
  readonly resultado = () => this.state().resultado;
  readonly guardadoId = () => this.state().guardadoId;

  nuevaFoto(foto: string): void {
    this.set({ foto, resultado: null, guardadoId: null });
  }

  setResultado(resultado: AnalysisResult): void {
    this.set({ ...this.state(), resultado, guardadoId: null });
  }

  marcarGuardado(id: string): void {
    this.set({ ...this.state(), guardadoId: id });
  }

  limpiar(): void {
    this.set(VACIO);
  }

  private set(next: CapturaState): void {
    this.state.set(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Sin almacenamiento (modo privado o cuota llena): seguimos solo en memoria.
    }
  }

  private leer(): CapturaState {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? { ...VACIO, ...JSON.parse(raw) } : VACIO;
    } catch {
      return VACIO;
    }
  }
}
