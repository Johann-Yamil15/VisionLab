import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { GeminiService, IaNoDisponibleError } from '../../core/ai/gemini.service';
import { AppIcons } from '../../shared/ui/icons';
import { CapturaStore } from './data-access/captura.store';

@Component({
  selector: 'app-preview-page',
  imports: [LucideAngularModule],
  templateUrl: './preview.page.html',
  styleUrl: './preview.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPage {
  private readonly store = inject(CapturaStore);
  private readonly gemini = inject(GeminiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly icons = AppIcons;
  protected readonly foto = this.store.foto();
  protected readonly analizando = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    if (!this.foto) this.router.navigate(['/microscopio'], { replaceUrl: true });
  }

  protected analizar(): void {
    if (!this.foto || this.analizando()) return;

    this.analizando.set(true);
    this.error.set(null);

    this.gemini
      .analyze(this.foto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.store.setResultado(resultado);
          this.router.navigate(['/descubrimiento']);
        },
        error: (err) => {
          this.analizando.set(false);
          this.error.set(
            err instanceof IaNoDisponibleError
              ? err.message
              : 'La IA no pudo ver bien tu foto. Revisa tu conexión e inténtalo otra vez.',
          );
        },
      });
  }

  protected repetir(): void {
    this.router.navigate(['/microscopio']);
  }
}
