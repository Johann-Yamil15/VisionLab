import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { formatDate } from '@angular/common';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { Especie } from '../../models/hallazgo.model';
import { tipoInfo } from '../../utils/tipos';
import { AppIcons } from '../icons';

interface Fila {
  icon: LucideIconData;
  label: string;
  valor: string;
}

/**
 * Carta coleccionable de una especie. El marco, la ventana, la píldora y las filas vienen
 * dibujados en la imagen de fondo de su categoría (public/cards/*.webp); aquí solo se coloca
 * el contenido encima, en las posiciones definidas en `tipos.ts`.
 * - `compact`: cuadrícula del almanaque.
 * - `full`: descubrimiento y detalle (agrega la píldora de tipo y el lema).
 */
@Component({
  selector: 'app-species-card',
  imports: [LucideAngularModule],
  templateUrl: './species-card.component.html',
  styleUrl: './species-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-full]': "variant() === 'full'" },
})
export class SpeciesCardComponent {
  readonly especie = input.required<Especie>();
  readonly imagen = input<string | null>(null);
  readonly veces = input(1);
  readonly fecha = input<string | null>(null);
  readonly variant = input<'compact' | 'full'>('compact');
  /** Si es true, la foto es un botón que emite `ampliar` (no usar dentro de un enlace). */
  readonly ampliable = input(false);
  readonly ampliar = output<void>();

  protected readonly icons = AppIcons;
  protected readonly tipo = computed(() => tipoInfo(this.especie().tipo));
  protected readonly confianza = computed(() =>
    Math.max(0, Math.min(100, Math.round(Number(this.especie().nivelConfianza) || 0))),
  );
  protected readonly lema = computed(() => this.especie().lema?.trim() || this.tipo().frase);

  /** Variables CSS con el fondo y la posición de cada espacio de la carta. */
  protected readonly estilo = computed(() => {
    const { slots, fondo, color } = this.tipo();
    return {
      '--fondo': `url('${fondo}')`,
      '--type-color': color,
      '--cab-t': slots.cabecera[0],
      '--cab-b': slots.cabecera[1],
      '--win-t': slots.ventana[0],
      '--win-b': slots.ventana[1],
      '--pil-t': slots.pildora[0],
      '--pil-b': slots.pildora[1],
      '--fil-t': slots.filas[0],
      '--fil-b': slots.filas[1],
      '--fil-n': slots.numFilas,
    };
  });

  protected readonly filas = computed<Fila[]>(() => {
    const f = this.fecha();
    const filas: Fila[] = [
      { icon: this.tipo().icon, label: 'Tipo', valor: this.tipo().label },
      { icon: AppIcons.ShieldCheck, label: 'Confianza', valor: `${this.confianza()}%` },
      { icon: AppIcons.CalendarDays, label: 'Descubierto', valor: f ? formatDate(f, 'd MMM y', 'es-MX') : '¡Hoy!' },
    ];
    if (this.tipo().slots.numFilas > 3) {
      const v = this.veces();
      filas.push({ icon: AppIcons.Footprints, label: 'Encontrado', valor: v === 1 ? '1 vez' : `${v} veces` });
    }
    return filas;
  });
}
