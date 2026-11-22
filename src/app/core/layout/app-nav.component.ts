import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AppIcons } from '../../shared/ui/icons';

interface Destino {
  ruta: string;
  etiqueta: string;
  icono: (typeof AppIcons)[keyof typeof AppIcons];
  /** La acción principal (el microscopio) va al centro y resaltada. */
  principal?: true;
}

/** Orden de la barra: el microscopio queda en el centro. */
const DESTINOS: readonly Destino[] = [
  { ruta: '/almanaque', etiqueta: 'Almanaque', icono: AppIcons.BookOpen },
  { ruta: '/atlas', etiqueta: 'Atlas', icono: AppIcons.Globe },
  { ruta: '/microscopio', etiqueta: 'Explorar', icono: AppIcons.Microscope, principal: true },
  { ruta: '/perfil', etiqueta: 'Mi perfil', icono: AppIcons.Trophy },
  { ruta: '/acerca', etiqueta: 'Acerca', icono: AppIcons.Info },
];

/**
 * Navegación principal, responsiva:
 * - barra inferior en móvil y tablet vertical (compacta, solo íconos, en móvil horizontal);
 * - riel lateral desde 1024 px.
 */
@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav" aria-label="Principal">
      <a class="brand" routerLink="/microscopio" aria-label="OmniScan, inicio">
        <img class="brand-mark" src="omniscan-icon-192.png" alt="" width="52" height="52" />
        <span class="brand-name">OmniScan</span>
      </a>

      <ul class="items">
        @for (d of destinos; track d.ruta) {
          <li [class.item-main]="d.principal">
            <a [routerLink]="d.ruta" routerLinkActive="active" ariaCurrentWhenActive="page">
              @if (d.principal) {
                <span class="main-bubble"><lucide-icon [img]="d.icono" [size]="28" aria-hidden="true" /></span>
              } @else {
                <lucide-icon [img]="d.icono" [size]="24" aria-hidden="true" />
              }
              <span class="etiqueta">{{ d.etiqueta }}</span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styleUrl: './app-nav.component.scss',
})
export class AppNavComponent {
  protected readonly destinos = DESTINOS;
}
