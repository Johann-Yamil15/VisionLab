import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, delay, map, Observable, of, throwError, timeout } from 'rxjs';
import { API_URL } from '../api/api';
import { AnalysisResult, Especie } from '../../shared/models/hallazgo.model';
import { DemoService } from './demo.service';

/** La IA del servidor no respondió (503, sin conexión o se agotó el tiempo). */
export class IaNoDisponibleError extends Error {
  constructor(mensaje = 'El análisis con IA no está disponible ahora. ¡Inténtalo en un momento!') {
    super(mensaje);
  }
}

/** Foto o pregunta rechazadas por el servidor (400): el mensaje ya viene listo para mostrarse. */
export class SolicitudInvalidaError extends Error {}

/** Máximo que acepta POST /api/chat. */
export const MAX_PREGUNTA = 300;

/** El CLI tarda 10–20 s; el servidor corta a los 60 s, así que aquí damos un poco más. */
const ESPERA_MAX_MS = 75_000;

/**
 * Cliente delgado de /api/analisis y /api/chat. La IA y su llave viven SOLO en el backend.
 */
@Injectable({ providedIn: 'root' })
export class IaService {
  private readonly http = inject(HttpClient);
  private readonly demo = inject(DemoService);

  analyze(imagenDataUrl: string): Observable<AnalysisResult> {
    // Modo demo: ficha precargada, sin llamar a la IA (con una pausa para que se vea la animación).
    if (this.demo.activo()) return of(this.demo.siguienteAnalisis()).pipe(delay(2500));

    return this.http.post<AnalysisResult>(`${API_URL}/analisis`, { imagen: imagenDataUrl }).pipe(
      timeout(ESPERA_MAX_MS),
      map((r) => ({ ...r, nivelConfianza: Number(r.nivelConfianza) || 0, opciones: r.opciones ?? [] })),
      catchError((err) => throwError(() => this.traducir(err))),
    );
  }

  chat(especie: Especie, pregunta: string): Observable<string> {
    if (this.demo.activo()) return of(this.demo.responder(especie, pregunta)).pipe(delay(600));

    const cuerpo = {
      especie: {
        nombreComun: especie.nombreComun,
        nombreCientifico: especie.nombreCientifico,
        descripcion: especie.descripcion,
      },
      pregunta: pregunta.slice(0, MAX_PREGUNTA),
    };
    return this.http.post<{ respuesta: string }>(`${API_URL}/chat`, cuerpo).pipe(
      timeout(ESPERA_MAX_MS),
      map((r) => r.respuesta ?? ''),
      catchError((err) => throwError(() => this.traducir(err))),
    );
  }

  private traducir(err: unknown): Error {
    if (err instanceof HttpErrorResponse && err.status === 400) {
      return new SolicitudInvalidaError(err.error?.detail ?? 'No pude usar esa información.');
    }
    // 503, sin red (status 0), timeout u otro fallo: para el niño es "la IA no está disponible".
    return new IaNoDisponibleError();
  }
}
