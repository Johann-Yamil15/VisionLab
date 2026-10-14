import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HallazgosService } from '../../shared/data-access/hallazgos.service';
import { AppIcons } from '../../shared/ui/icons';
import { ExpertChatComponent } from '../../shared/ui/expert-chat/expert-chat.component';
import { SpeciesCardComponent } from '../../shared/ui/species-card/species-card.component';
import { CapturaStore } from '../microscope/data-access/captura.store';

type Guardado = 'guardando' | 'guardado' | 'error';

@Component({
  selector: 'app-discovery-page',
  imports: [RouterLink, LucideAngularModule, SpeciesCardComponent, ExpertChatComponent],
  templateUrl: './discovery.page.html',
  styleUrl: './discovery.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoveryPage {
  private readonly store = inject(CapturaStore);
  private readonly hallazgos = inject(HallazgosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly icons = AppIcons;
  protected readonly foto = this.store.foto();
  protected readonly resultado = this.store.resultado();
  protected readonly guardado = signal<Guardado>(this.store.guardadoId() ? 'guardado' : 'guardando');

  /** Misma regla que el backend: 10 puntos + 1 por cada 10% de confianza. */
  protected readonly puntos = computed(() => 10 + Math.round((this.resultado?.nivelConfianza ?? 0) / 10));

  constructor() {
    if (!this.resultado || !this.foto) {
      this.router.navigate(['/microscopio'], { replaceUrl: true });
      return;
    }
    if (!this.store.guardadoId()) this.guardar();
  }

  protected guardar(): void {
    if (!this.resultado || !this.foto) return;
    this.guardado.set('guardando');

    this.hallazgos
      .crear({ ...this.resultado, imagenBase64: this.foto })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (h) => {
          this.store.marcarGuardado(h.id);
          this.guardado.set('guardado');
        },
        error: () => this.guardado.set('error'),
      });
  }

  protected explorarOtraVez(): void {
    this.store.limpiar();
    this.router.navigate(['/microscopio']);
  }
}
