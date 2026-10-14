import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Especie } from '../../models/hallazgo.model';
import { tipoInfo } from '../../utils/tipos';
import { AppIcons } from '../icons';

/**
 * Tarjeta coleccionable de una especie.
 * - `compact`: para la cuadrícula del almanaque.
 * - `full`: carta completa con datos, paisaje y lema (descubrimiento y detalle).
 * Es solo presentación: el contenedor decide si es enlace o botón.
 */
@Component({
  selector: 'app-species-card',
  imports: [DatePipe, LucideAngularModule],
  templateUrl: './species-card.component.html',
  styleUrl: './species-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-full]': "variant() === 'full'",
    '[style.--type-color]': 'tipo().color',
  },
})
export class SpeciesCardComponent {
  readonly especie = input.required<Especie>();
  readonly imagen = input<string | null>(null);
  readonly veces = input(1);
  readonly fecha = input<string | null>(null);
  readonly variant = input<'compact' | 'full'>('compact');

  protected readonly icons = AppIcons;
  protected readonly tipo = computed(() => tipoInfo(this.especie().tipo));
  protected readonly confianza = computed(() =>
    Math.max(0, Math.min(100, Math.round(Number(this.especie().nivelConfianza) || 0))),
  );
  protected readonly lema = computed(() => this.especie().lema?.trim() || this.tipo().frase);
}
