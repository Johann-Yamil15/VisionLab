import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AppIcons } from '../ui/icons';
import { AccesibilidadService } from './accesibilidad.service';

@Component({
  selector: 'app-accesibilidad',
  imports: [LucideAngularModule],
  templateUrl: './accesibilidad.component.html',
  styleUrl: './accesibilidad.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:pointermove)': 'onPointerMove($event)',
    '(document:keydown.escape)': 'abierto.set(false)',
  },
})
export class AccesibilidadComponent {
  protected readonly service = inject(AccesibilidadService);
  protected readonly config = this.service.config;
  protected readonly fuente = this.service.limitesFuente;
  protected readonly icons = AppIcons;
  protected readonly abierto = signal(false);
  protected readonly lineaY = signal(0);

  protected onPointerMove(e: PointerEvent): void {
    if (this.config().lineaActiva) this.lineaY.set(e.clientY);
    if (e.pointerType === 'mouse') this.service.manejarMouseMove(e.clientX, e.clientY);
  }
}
