import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AppNavComponent } from './core/layout/app-nav.component';
import { AccesibilidadComponent } from './shared/accesibilidad/accesibilidad.component';
import { ToastsComponent } from './shared/ui/toast/toasts.component';

const RUTAS_DE_ACCESO = ['/login', '/registro'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavComponent, AccesibilidadComponent, ToastsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);

  /** En login y registro no hay barra de navegación (todavía no hay a dónde ir). */
  protected readonly enAcceso = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => RUTAS_DE_ACCESO.some((r) => e.urlAfterRedirects.startsWith(r))),
    ),
    { initialValue: RUTAS_DE_ACCESO.some((r) => this.router.url.startsWith(r)) },
  );
}
