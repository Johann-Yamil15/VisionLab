import {
  ChangeDetectionStrategy,
  Component,
  signal
} from '@angular/core';

import {
  CommonModule,
  NgClass
} from '@angular/common';

import {
  RouterOutlet,
  RouterModule,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgClass,
    RouterOutlet,
    RouterModule,
    RouterLink,
    RouterLinkActive
  ]
})
export class App {
  // Estado del menú de perfil
  isProfileMenuOpen = signal(false);

  // Alternar menú de perfil
  toggleProfileMenu() {
    this.isProfileMenuOpen.update(v => !v);
  }
}