import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../core/api/api';
import { Hallazgo, NuevoHallazgo } from '../models/hallazgo.model';
import { claveEspecie } from '../utils/imagen';

/** Una tarjeta del almanaque: misma especie encontrada una o varias veces. */
export interface GrupoEspecie {
  clave: string;
  /** Captura más reciente (la que se muestra en la tarjeta). */
  principal: Hallazgo;
  veces: number;
  capturas: Hallazgo[];
}

@Injectable({ providedIn: 'root' })
export class HallazgosService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/hallazgos`;

  listar(): Observable<Hallazgo[]> {
    return this.http.get<Hallazgo[]>(this.url);
  }

  obtener(id: string): Observable<Hallazgo> {
    return this.http.get<Hallazgo>(`${this.url}/${id}`);
  }

  crear(hallazgo: NuevoHallazgo): Observable<Hallazgo> {
    return this.http.post<Hallazgo>(this.url, hallazgo);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

/**
 * Agrupa capturas de la misma especie en una sola tarjeta ("¡lo encontraste 2 veces!").
 * Mientras el backend no lo haga, se resuelve aquí al mostrar.
 */
export function agruparPorEspecie(hallazgos: Hallazgo[]): GrupoEspecie[] {
  const grupos = new Map<string, Hallazgo[]>();
  for (const h of hallazgos) {
    const clave = claveEspecie(h.nombreCientifico, h.nombreComun) || h.id;
    grupos.set(clave, [...(grupos.get(clave) ?? []), h]);
  }

  return [...grupos.entries()]
    .map(([clave, capturas]) => {
      const ordenadas = [...capturas].sort((a, b) => b.fechaCaptura.localeCompare(a.fechaCaptura));
      return { clave, principal: ordenadas[0], veces: ordenadas.length, capturas: ordenadas };
    })
    .sort((a, b) => b.principal.fechaCaptura.localeCompare(a.principal.fechaCaptura));
}
