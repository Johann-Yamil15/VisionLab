import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Especie } from '../../models/hallazgo.model';
import { tipoInfo } from '../../utils/tipos';
import { AppIcons } from '../icons';

/**
 * Tarjeta coleccionable de una especie (estilo cartas de colección).
 * Es solo presentación: el contenedor decide si es un enlace o un botón.
 */
@Component({
  selector: 'app-species-card',
  imports: [DatePipe, LucideAngularModule],
  templateUrl: './species-card.component.html',
  styleUrl: './species-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.card--lg]': "size() === 'lg'",
    '[style.--type-color]': 'tipo().color',
  },
})
export class SpeciesCardComponent {
  readonly especie = input.required<Especie>();
  readonly imagen = input<string | null>(null);
  readonly veces = input(1);
  readonly fecha = input<string | null>(null);
  readonly size = input<'sm' | 'lg'>('sm');

  protected readonly icons = AppIcons;
  protected readonly tipo = computed(() => tipoInfo(this.especie().tipo));
  protected readonly confianza = computed(() =>
    Math.max(0, Math.min(100, Math.round(Number(this.especie().nivelConfianza) || 0))),
  );
}
