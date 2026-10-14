import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { HallazgosService } from '../../shared/data-access/hallazgos.service';
import { Hallazgo } from '../../shared/models/hallazgo.model';
import { AppIcons } from '../../shared/ui/icons';
import { ExpertChatComponent } from '../../shared/ui/expert-chat/expert-chat.component';
import { SpeciesCardComponent } from '../../shared/ui/species-card/species-card.component';
import { claveEspecie, imagenSrc } from '../../shared/utils/imagen';

type Estado = 'cargando' | 'listo' | 'no-encontrado';

@Component({
  selector: 'app-almanac-detail-page',
  imports: [DatePipe, RouterLink, LucideAngularModule, SpeciesCardComponent, ExpertChatComponent],
  templateUrl: './almanac-detail.page.html',
  styleUrl: './almanac-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrarDialogo()' },
})
export class AlmanacDetailPage {
  /** Viene de la ruta /almanaque/:id (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly service = inject(HallazgosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly cancelarBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelar');

  protected readonly icons = AppIcons;
  protected readonly imagenSrc = imagenSrc;
  protected readonly estado = signal<Estado>('cargando');
  protected readonly hallazgo = signal<Hallazgo | null>(null);
  private readonly todos = signal<Hallazgo[]>([]);
  protected readonly dialogoAbierto = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly errorEliminar = signal(false);

  /** Otras capturas de la misma especie. */
  protected readonly otras = computed(() => {
    const h = this.hallazgo();
    if (!h) return [];
    const clave = claveEspecie(h.nombreCientifico, h.nombreComun);
    return this.todos().filter((o) => o.id !== h.id && claveEspecie(o.nombreCientifico, o.nombreComun) === clave);
  });

  constructor() {
    effect(() => this.cargar(this.id()));
  }

  private cargar(id: string): void {
    this.estado.set('cargando');
    forkJoin({ hallazgo: this.service.obtener(id), todos: this.service.listar() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ hallazgo, todos }) => {
          this.hallazgo.set(hallazgo);
          this.todos.set(todos);
          this.estado.set('listo');
        },
        error: () => this.estado.set('no-encontrado'),
      });
  }

  protected abrirDialogo(): void {
    this.errorEliminar.set(false);
    this.dialogoAbierto.set(true);
    afterNextRender(() => this.cancelarBtn()?.nativeElement.focus(), { injector: this.injector });
  }

  protected cerrarDialogo(): void {
    if (!this.eliminando()) this.dialogoAbierto.set(false);
  }

  protected eliminar(): void {
    const h = this.hallazgo();
    if (!h) return;
    this.eliminando.set(true);

    this.service
      .eliminar(h.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/almanaque'], { replaceUrl: true }),
        error: () => {
          this.eliminando.set(false);
          this.errorEliminar.set(true);
        },
      });
  }
}
