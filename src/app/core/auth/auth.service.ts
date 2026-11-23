import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../api/api';

export interface UsuarioSesion {
  id: string;
  nombreUsuario: string;
  email: string;
  puntos: number;
  nivel: number;
}

/** Respuesta de POST /api/auth/login y /register. */
interface Sesion {
  token: string;
  usuario: UsuarioSesion;
}

const CLAVE_SESION = 'visionlab.sesion';

/** Sesión del usuario: el JWT se guarda en localStorage y el interceptor lo manda en cada petición. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sesion = signal<Sesion | null>(this.leer());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly autenticado = computed(() => this.sesion() !== null);

  get token(): string | null {
    return this.sesion()?.token ?? null;
  }

  iniciarSesion(email: string, contrasena: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${API_URL}/auth/login`, { email, contraseña: contrasena })
      .pipe(tap((s) => this.guardar(s)));
  }

  registrar(nombreUsuario: string, email: string, contrasena: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${API_URL}/auth/register`, { nombreUsuario, email, contraseña: contrasena })
      .pipe(tap((s) => this.guardar(s)));
  }

  cerrarSesion(): void {
    this.sesion.set(null);
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      /* almacenamiento no disponible */
    }
    this.router.navigate(['/login']);
  }

  private guardar(sesion: Sesion): void {
    this.sesion.set(sesion);
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      /* la sesión sigue en memoria */
    }
  }

  private leer(): Sesion | null {
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null') as Sesion | null;
      return s?.token && s.usuario ? s : null;
    } catch {
      return null;
    }
  }
}
