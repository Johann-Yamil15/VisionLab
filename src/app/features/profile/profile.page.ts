import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Perfil } from '../../shared/models/perfil.model';
import { AppIcons } from '../../shared/ui/icons';
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
  private readonly service = inject(PerfilService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly icons = AppIcons;
  protected readonly estado = signal<Estado>('cargando');
  protected readonly perfil = signal<Perfil | null>(null);

  protected readonly iniciales = computed(() =>
    (this.perfil()?.nombreUsuario ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join(''),
  );

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');
    this.service
      .obtener()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => {
          this.perfil.set(p);
          this.estado.set('listo');
        },
        error: () => this.estado.set('error'),
      });
  }
}
