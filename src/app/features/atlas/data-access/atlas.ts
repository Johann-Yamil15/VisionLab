import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, concat, EMPTY, map, Observable, of, shareReplay, switchMap } from 'rxjs';
import { HallazgosService, agruparPorEspecie } from '../../../shared/data-access/hallazgos.service';
import { Hallazgo } from '../../../shared/models/hallazgo.model';
import { claveEspecie, imagenSrc } from '../../../shared/utils/imagen';
import { buscarEnAtlas } from '../../../shared/utils/atlas-match';

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
  /** Otros nombres con los que la IA puede identificarlo ("catarina" para "mariquita"). Opcional. */
  alias?: string[];
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
  /** Descubierto por la persona (Atlas personal): sin modelo, sonido ni fondo. Solo ella lo ve. */
  propio?: boolean;
  /** Tamaño real para compararlo con una persona de 1.70 m. */
  tamano?: { metros: number; medida: 'largo' | 'alto' | 'diametro' };
}

/** Id estable de un elemento personal: no cambia aunque la persona vuelva a escanear la misma especie. */
export const PREFIJO_PERSONAL = 'mi-';

/**
 * Atlas personal: una entrada por especie que la persona escaneó y que la IA pudo ubicar en el mapa
 * (tiene grupo y coordenadas). Se omiten las que ya están en el catálogo fijo (ya tienen su pin y su modelo).
 */
export function elementosPersonales(hallazgos: readonly Hallazgo[], catalogo: readonly ElementoAtlas[]): ElementoAtlas[] {
  const elementos: ElementoAtlas[] = [];

  for (const grupo of agruparPorEspecie([...hallazgos])) {
    // La captura más reciente que traiga ubicación (las anteriores a esta función no la tienen).
    const h = grupo.capturas.find((c) => c.grupoAtlas && c.latitud != null && c.longitud != null);
    if (!h || !h.grupoAtlas) continue;
    if (buscarEnAtlas(catalogo, h.nombreComun, h.nombreCientifico)) continue;

    elementos.push({
      id: PREFIJO_PERSONAL + claveEspecie(h.nombreCientifico, h.nombreComun).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      nombre: h.nombreComun,
      nombreCientifico: h.nombreCientifico,
      categoria: h.grupoAtlas,
      lat: h.latitud!,
      lng: h.longitud!,
      region: h.region ?? '',
      estatus: '',
      descripcion: h.descripcion,
      miniatura: imagenSrc(grupo.principal.imagenBase64) ?? '',
      modelo: '',
      sonido: '',
      habitat: '',
      credito: 'Tu foto',
      creditoModelo: '',
      creditoSonido: '',
      creditoHabitat: '',
      puntos: [],
      propio: true,
    });
  }
  return elementos;
}

/** Catálogo fijo del Atlas: se lee una vez de public/ y funciona sin internet. */
@Injectable({ providedIn: 'root' })
export class AtlasService {
  private readonly hallazgos = inject(HallazgosService);

  readonly elementos$ = inject(HttpClient).get<ElementoAtlas[]>('atlas3d/atlas.json').pipe(shareReplay(1));

  /** Elementos personales de quien tiene sesión; sin sesión o si falla la lectura, ninguno. Se pide cada vez. */
  personales(catalogo: readonly ElementoAtlas[]): Observable<ElementoAtlas[]> {
    return this.hallazgos.listar().pipe(
      map((h) => elementosPersonales(h, catalogo)),
      catchError(() => of([])),
    );
  }

  /** El catálogo fijo primero (pinta al instante) y, cuando llegan, con los elementos personales añadidos. */
  conPersonales$(): Observable<ElementoAtlas[]> {
    return this.elementos$.pipe(
      switchMap((base) =>
        concat(
          of(base),
          this.personales(base).pipe(switchMap((p) => (p.length ? of([...base, ...p]) : EMPTY))),
        ),
      ),
    );
  }
}
