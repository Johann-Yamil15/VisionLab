import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Hallazgo {
  id: string;
  usuarioId: string;
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: number;
  imagenBase64?: string;
  fechaCaptura: string;
}

export interface HallazgoRequest {
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: string;
  imagenBase64?: string;
  usuarioId?: string;
}

export interface AnalysisResult {
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: string;
}

@Injectable({
  providedIn: 'root'
})
export class HallazgosService {
  private apiUrl = 'https://localhost:44312/api/Hallazgos';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los hallazgos
   */
  getAllHallazgos(): Observable<Hallazgo[]> {
    return this.http.get<Hallazgo[]>(this.apiUrl);
  }

  /**
   * Obtiene un hallazgo por ID
   */
  getHallazgoById(id: string): Observable<Hallazgo> {
    return this.http.get<Hallazgo>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo hallazgo
   */
  createHallazgo(hallazgo: HallazgoRequest): Observable<Hallazgo> {
    console.log('💾 HallazgosService | Guardando hallazgo:', hallazgo);
    return this.http.post<Hallazgo>(this.apiUrl, hallazgo);
  }

  /**
   * Crea un hallazgo desde el resultado del análisis de IA
   */
  createFromAnalysis(analysis: AnalysisResult, imageBase64?: string, usuarioId?: string): Observable<Hallazgo> {
    const hallazgo: HallazgoRequest = {
      tipo: analysis.tipo,
      nombreComun: analysis.nombreComun,
      nombreCientifico: analysis.nombreCientifico,
      descripcion: analysis.descripcion,
      nivelConfianza: analysis.nivelConfianza,
      imagenBase64: imageBase64,
      usuarioId: usuarioId || 'anonymous'
    };

    console.log('🤖 HallazgosService | Guardando desde análisis IA:', hallazgo);
    return this.createHallazgo(hallazgo);
  }

  /**
   * Elimina un hallazgo por ID
   */
  deleteHallazgo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Filtra hallazgos por tipo (en el cliente)
   */
  filterByTipo(hallazgos: Hallazgo[], tipo: string): Hallazgo[] {
    if (!tipo || tipo === 'todos') {
      return hallazgos;
    }
    return hallazgos.filter(h => 
      h.tipo.toLowerCase() === tipo.toLowerCase()
    );
  }

  /**
   * Obtiene todos los tipos únicos de hallazgos
   */
  getTiposUnicos(hallazgos: Hallazgo[]): string[] {
    const tipos = hallazgos.map(h => h.tipo);
    return [...new Set(tipos)].sort();
  }
}