import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { AUTH_FORM_STYLES } from './auth-form.styles';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [AUTH_FORM_STYLES],
  template: `
    <div class="wrap">
      <form class="clay" (ngSubmit)="registrar()">
        <h1>Crea tu cuenta</h1>
        <p class="sub">Guarda tus hallazgos, gana puntos y desbloquea medallas.</p>

        <label>
          Nombre de explorador
          <input name="nombre" [(ngModel)]="nombre" required autocomplete="username" />
        </label>
        <label>
          Correo
          <input type="email" name="email" [(ngModel)]="email" required autocomplete="email" />
        </label>
        <label>
          Contraseña (mínimo 6 caracteres)
          <input type="password" name="contrasena" [(ngModel)]="contrasena" required minlength="6" autocomplete="new-password" />
        </label>

        @if (error()) {
          <div class="alert alert--danger" role="alert">{{ error() }}</div>
        }

        <button
          class="btn btn--primary btn--lg btn--block"
          type="submit"
          [disabled]="cargando() || !nombre.trim() || !email || contrasena.length < 6"
        >
          {{ cargando() ? 'Creando…' : 'Crear cuenta' }}
        </button>
        <p class="alt">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
      </form>
    </div>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected nombre = '';
  protected email = '';
  protected contrasena = '';
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected registrar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.auth.registrar(this.nombre, this.email, this.contrasena).subscribe({
      next: () => this.router.navigate(['/microscopio']),
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(
          e.status === 409
            ? 'Ese correo ya está registrado. ¿Quieres iniciar sesión?'
            : e.status === 400
              ? 'Revisa los datos: correo válido y contraseña de al menos 6 caracteres.'
              : 'No pudimos conectar con el servidor. Inténtalo de nuevo.',
        );
      },
    });
  }
}
