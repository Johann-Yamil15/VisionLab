import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { shareReplay } from 'rxjs';

export type CategoriaAtlas = 'fauna' | 'flora' | 'mineral';

/** Color y nombre de cada categoría: los comparten el globo y el detalle 3D. */
export const COLOR_CATEGORIA: Record<CategoriaAtlas, string> = { fauna: '#f59e0b', flora: '#22c55e', mineral: '#a78bfa' };
/** Color de chips y etiquetas: tokens del sistema (texto blanco encima con contraste AA). Los pines usan los brillantes. */
export const TOKEN_CATEGORIA: Record<CategoriaAtlas, string> = { fauna: 'var(--t-luz)', flora: 'var(--t-planta)', mineral: 'var(--t-hongo)' };
export const NOMBRE_CATEGORIA: Record<CategoriaAtlas, string> = { fauna: 'Fauna', flora: 'Flora', mineral: 'Minerales' };

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
  /** Ruta al .glb. Si está vacía, la ficha muestra "Modelo 3D en preparación". */
  modelo: string;
  /** Ruta al .mp3 (sonido del animal o ambiente). */
  sonido: string;
  /** Ruta a la imagen de fondo del hábitat. */
  habitat: string;
  miniatura: string;
  /** Crédito de la foto (miniatura). */
  credito: string;
  /** Autor · licencia · fuente del modelo 3D, del sonido y del fondo. */
  creditoModelo: string;
  creditoSonido: string;
  creditoHabitat: string;
  puntos: PuntoAtlas[];
  /** Ruta migratoria opcional: se dibuja como arcos animados entre puntos consecutivos. */
  migracion?: { lat: number; lng: number }[];
  /** Tamaño real para compararlo con una persona de 1.70 m. */
  tamano?: { metros: number; medida: 'largo' | 'alto' | 'diametro' };
}

/** Catálogo fijo del Atlas: se lee una vez de public/ y funciona sin internet. */
@Injectable({ providedIn: 'root' })
export class AtlasService {
  readonly elementos$ = inject(HttpClient).get<ElementoAtlas[]>('atlas3d/atlas.json').pipe(shareReplay(1));
}
