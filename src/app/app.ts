import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppNavComponent } from './core/layout/app-nav.component';
import { AccesibilidadComponent } from './shared/accesibilidad/accesibilidad.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppNavComponent, AccesibilidadComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
