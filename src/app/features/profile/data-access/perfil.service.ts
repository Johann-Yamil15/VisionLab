import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/api/api';
import { Perfil } from '../../../shared/models/perfil.model';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);

  /** Perfil del usuario actual (puntos, nivel y medallas). */
  obtener(): Observable<Perfil> {
    return this.http.get<Perfil>(`${API_URL}/usuarios`);
  }
}
