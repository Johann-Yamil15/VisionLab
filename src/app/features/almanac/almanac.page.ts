import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { agruparPorEspecie, HallazgosService } from '../../shared/data-access/hallazgos.service';
import { Hallazgo } from '../../shared/models/hallazgo.model';
import { AppIcons } from '../../shared/ui/icons';
import { SpeciesCardComponent } from '../../shared/ui/species-card/species-card.component';
import { imagenSrc } from '../../shared/utils/imagen';
import { normalizarTipo, TipoClave, todosLosTipos } from '../../shared/utils/tipos';

type Estado = 'cargando' | 'listo' | 'error';

@Component({
  selector: 'app-almanac-page',
  imports: [RouterLink, LucideAngularModule, SpeciesCardComponent],
  templateUrl: './almanac.page.html',
  styleUrl: './almanac.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlmanacPage {
  private readonly service = inject(HallazgosService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly icons = AppIcons;
  protected readonly imagenSrc = imagenSrc;
  protected readonly esqueletos = Array.from({ length: 8 });

  protected readonly estado = signal<Estado>('cargando');
  private readonly hallazgos = signal<Hallazgo[]>([]);
  protected readonly filtro = signal<TipoClave | 'todos'>('todos');
  /** ?buscar= en la URL (lo usa el buscador del perfil). */
  readonly textoUrl = input<string | undefined>(undefined, { alias: 'buscar' });
  protected readonly busqueda = linkedSignal(() => this.textoUrl() ?? '');

  protected readonly grupos = computed(() => agruparPorEspecie(this.hallazgos()));

  /** Solo los tipos que el niño ya encontró, con cuántas especies tiene de cada uno. */
  protected readonly tipos = computed(() => {
    const conteo = new Map<TipoClave, number>();
    for (const g of this.grupos()) {
      const t = normalizarTipo(g.principal.tipo);
      conteo.set(t, (conteo.get(t) ?? 0) + 1);
    }
    return todosLosTipos()
      .filter((t) => conteo.has(t.clave))
      .map((t) => ({ ...t, total: conteo.get(t.clave)! }));
  });

  protected readonly visibles = computed(() => {
    const filtro = this.filtro();
    const q = this.normalizar(this.busqueda());
    return this.grupos().filter(
      (g) =>
        (filtro === 'todos' || normalizarTipo(g.principal.tipo) === filtro) &&
        (!q || this.normalizar(`${g.principal.nombreComun} ${g.principal.nombreCientifico}`).includes(q)),
    );
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');
    this.service
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.hallazgos.set(data);
          this.estado.set('listo');
        },
        error: () => this.estado.set('error'),
      });
  }

  protected buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  private normalizar(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }
}
