import { Injectable, signal } from '@angular/core';
import { Progreso } from '../../models/perfil.model';

export interface Toast {
  id: number;
  tipo: 'medalla' | 'nivel' | 'puntos';
  titulo: string;
  texto: string;
  imagen?: string;
}

const DURACION_MS = 6000;

/** Notificaciones flotantes (toasts). Las muestra <app-toasts> en el shell de la app. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private siguienteId = 1;
  readonly toasts = signal<Toast[]>([]);

  mostrar(toast: Omit<Toast, 'id'>): void {
    const id = this.siguienteId++;
    this.toasts.update((lista) => [...lista, { ...toast, id }]);
    setTimeout(() => this.cerrar(id), DURACION_MS);
  }

  cerrar(id: number): void {
    this.toasts.update((lista) => lista.filter((t) => t.id !== id));
  }

  /** Un toast por cada cosa ganada al guardar un hallazgo: XP, medallas nuevas y rango nuevo. */
  celebrar(progreso: Progreso | null | undefined): void {
    if (!progreso) return;
    this.mostrar({
      tipo: 'puntos',
      titulo: `+${progreso.puntosGanados} XP`,
      texto: 'Muestra registrada en tu bitácora de campo.',
    });
    for (const m of progreso.medallasNuevas) {
      this.mostrar({
        tipo: 'medalla',
        titulo: '¡Medalla desbloqueada!',
        texto: m.puntos ? `${m.nombre} · +${m.puntos} XP` : m.nombre,
        imagen: m.imagen,
      });
    }
    if (progreso.nivelNuevo) {
      this.mostrar({
        tipo: 'nivel',
        titulo: '¡Ascenso de rango!',
        texto: `Ahora eres ${progreso.nivelNuevo.titulo} (nivel ${progreso.nivelNuevo.numero}).`,
      });
    }
  }
}
