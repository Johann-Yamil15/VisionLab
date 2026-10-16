import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { HallazgosService } from '../../shared/data-access/hallazgos.service';
import { Hallazgo } from '../../shared/models/hallazgo.model';
import { Perfil } from '../../shared/models/perfil.model';
import { AppIcons } from '../../shared/ui/icons';
import {
  coleccion,
  estadisticas,
  META_COLECCION,
  medallas,
  progresoNivel,
  siguientesRetos,
} from './data-access/gamificacion';
import { PerfilService } from './data-access/perfil.service';

type Estado = 'cargando' | 'listo' | 'error';

@Component({
  selector: 'app-profile-page',
  imports: [DecimalPipe, RouterLink, LucideAngularModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly perfiles = inject(PerfilService);
  private readonly hallazgos = inject(HallazgosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly icons = AppIcons;
  protected readonly metaColeccion = META_COLECCION;
  protected readonly estado = signal<Estado>('cargando');
  protected readonly perfil = signal<Perfil | null>(null);
  private readonly lista = signal<Hallazgo[]>([]);

  protected readonly nivel = computed(() => progresoNivel(this.perfil()?.puntos ?? 0));
  private readonly stats = computed(() => estadisticas(this.lista(), this.perfil()?.hallazgosContador ?? 0));
  protected readonly descubrimientos = computed(() => this.stats().total);
  protected readonly medallas = computed(() => medallas(this.stats()));
  protected readonly desbloqueadas = computed(() => this.medallas().filter((m) => m.desbloqueada).length);
  protected readonly retos = computed(() => siguientesRetos(this.medallas()));
  protected readonly coleccion = computed(() => coleccion(this.lista()));

  protected readonly inicial = computed(() => (this.perfil()?.nombreUsuario.trim()[0] ?? '?').toUpperCase());
  /** Solo el primer nombre, como en una credencial ("Johann"). */
  protected readonly nombreCorto = computed(() => this.perfil()?.nombreUsuario.trim().split(/\s+/)[0] ?? '');

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');
    forkJoin({ perfil: this.perfiles.obtener(), lista: this.hallazgos.listar() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ perfil, lista }) => {
          this.perfil.set(perfil);
          this.lista.set(lista);
          this.estado.set('listo');
        },
        error: () => this.estado.set('error'),
      });
  }

  /** El buscador lleva al almanaque con el texto ya filtrado. */
  protected buscar(event: Event, texto: string): void {
    event.preventDefault();
    const q = texto.trim();
    this.router.navigate(['/almanaque'], { queryParams: q ? { buscar: q } : {} });
  }
}
