import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AppIcons } from '../../shared/ui/icons';

/**
 * Navegación principal: barra inferior en móvil y riel lateral en escritorio (≥1024px).
 * El microscopio va al centro y resaltado porque es la acción principal.
 */
@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="nav" aria-label="Principal">
      <a class="brand" routerLink="/microscopio" aria-label="VisionLab, inicio">
        <span class="brand-mark"><lucide-icon [img]="icons.Microscope" [size]="26" aria-hidden="true" /></span>
        <span class="brand-name">VisionLab</span>
      </a>

      <ul class="items">
        <li>
          <a routerLink="/almanaque" routerLinkActive="active" ariaCurrentWhenActive="page">
            <lucide-icon [img]="icons.BookOpen" [size]="24" aria-hidden="true" />
            <span>Almanaque</span>
          </a>
        </li>
        <li class="item-main">
          <a routerLink="/microscopio" routerLinkActive="active" ariaCurrentWhenActive="page">
            <span class="main-bubble"><lucide-icon [img]="icons.Microscope" [size]="28" aria-hidden="true" /></span>
            <span>Explorar</span>
          </a>
        </li>
        <li>
          <a routerLink="/perfil" routerLinkActive="active" ariaCurrentWhenActive="page">
            <lucide-icon [img]="icons.Trophy" [size]="24" aria-hidden="true" />
            <span>Mi perfil</span>
          </a>
        </li>
        <li>
          <a routerLink="/acerca" routerLinkActive="active" ariaCurrentWhenActive="page">
            <lucide-icon [img]="icons.Info" [size]="24" aria-hidden="true" />
            <span>Acerca</span>
          </a>
        </li>
      </ul>
    </nav>
  `,
  styleUrl: './app-nav.component.scss',
})
export class AppNavComponent {
  protected readonly icons = AppIcons;
}
