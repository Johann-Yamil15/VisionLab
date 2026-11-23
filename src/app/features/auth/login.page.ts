import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { AUTH_FORM_STYLES } from './auth-form.styles';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [AUTH_FORM_STYLES],
  template: `
    <div class="wrap">
      <form class="clay" (ngSubmit)="entrar()">
        <h1>¡Hola, explorador!</h1>
        <p class="sub">Inicia sesión para ver tu almanaque y seguir coleccionando.</p>

        <label>
          Correo
          <input type="email" name="email" [(ngModel)]="email" required autocomplete="email" />
        </label>
        <label>
          Contraseña
          <input type="password" name="contrasena" [(ngModel)]="contrasena" required autocomplete="current-password" />
        </label>

        @if (error()) {
          <div class="alert alert--danger" role="alert">{{ error() }}</div>
        }

        <button class="btn btn--primary btn--lg btn--block" type="submit" [disabled]="cargando() || !email || !contrasena">
          {{ cargando() ? 'Entrando…' : 'Entrar' }}
        </button>
        <p class="alt">¿Aún no tienes cuenta? <a routerLink="/registro">Crea una</a></p>
      </form>
    </div>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected contrasena = '';
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected entrar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.auth.iniciarSesion(this.email, this.contrasena).subscribe({
      next: () => this.router.navigate(['/microscopio']),
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 401 ? 'Correo o contraseña incorrectos.' : 'No pudimos conectar con el servidor. Inténtalo de nuevo.',
        );
      },
    });
  }
}
