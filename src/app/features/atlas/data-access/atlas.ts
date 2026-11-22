import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { shareReplay } from 'rxjs';

export type CategoriaAtlas = 'fauna' | 'flora' | 'mineral';

/** Punto interactivo sobre el modelo 3D (hotspot de model-viewer). */
export interface PuntoAtlas {
  etiqueta: string;
  texto: string;
  posicion: string;
  normal: string;
}

/** Un elemento del Atlas Vivo 3D. Contrato de public/atlas3d/atlas.json. */
export interface ElementoAtlas {
  id: string;
  nombre: string;
  nombreCientifico: string;
  categoria: CategoriaAtlas;
  lat: number;
  lng: number;
  region: string;
  estatus: string;
  descripcion: string;
  modelo: string;
  miniatura: string;
  credito: string;
  puntos: PuntoAtlas[];
  /** Ruta migratoria opcional: se dibuja como arcos animados entre puntos consecutivos. */
  migracion?: { lat: number; lng: number }[];
}

/** Catálogo fijo del Atlas: se lee una vez de public/ y funciona sin internet. */
@Injectable({ providedIn: 'root' })
export class AtlasService {
  readonly elementos$ = inject(HttpClient).get<ElementoAtlas[]>('atlas3d/atlas.json').pipe(shareReplay(1));
}
