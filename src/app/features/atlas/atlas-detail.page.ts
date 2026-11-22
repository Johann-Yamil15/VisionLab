import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  Injector,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { Especie } from '../../shared/models/hallazgo.model';
import { AppIcons } from '../../shared/ui/icons';
import { ExpertChatComponent } from '../../shared/ui/expert-chat/expert-chat.component';
import { AtlasService, ElementoAtlas, NOMBRE_CATEGORIA, PuntoAtlas, TOKEN_CATEGORIA } from './data-access/atlas';

type EstadoModelo = 'cargando' | 'listo' | 'error';

/** Lo que usamos del elemento <model-viewer> (la librería se carga bajo demanda). */
interface Visor extends HTMLElement {
  canActivateAR: boolean;
  activateAR(): Promise<void>;
}

/** Tipo que espera el chat del experto según la categoría del Atlas. */
const TIPO_CHAT = { fauna: 'Otro', flora: 'Plantas', mineral: 'Rocas y minerales' } as const;

/** Detalle inmersivo de un elemento del Atlas: modelo 3D sobre su hábitat, sonido, historia y chat. */
@Component({
  selector: 'app-atlas-detail-page',
  imports: [DecimalPipe, RouterLink, LucideAngularModule, ExpertChatComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './atlas-detail.page.html',
  styleUrl: './atlas-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtlasDetailPage {
  /** Viene de la ruta /atlas/:id (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly chat = viewChild(ExpertChatComponent);
  private readonly visor = viewChild<ElementRef<Visor>>('visor');
  private readonly audio = viewChild<ElementRef<HTMLAudioElement>>('audio');

  protected readonly icons = AppIcons;
  protected readonly chipColor = TOKEN_CATEGORIA;
  protected readonly nombreCategoria = NOMBRE_CATEGORIA;

  // undefined = cargando, null = falló la lectura del catálogo.
  private readonly catalogo = toSignal(inject(AtlasService).elementos$.pipe(catchError(() => of(null))));
  protected readonly elemento = computed(() => this.catalogo()?.find((e) => e.id === this.id()) ?? null);
  protected readonly estado = computed(() => {
    const c = this.catalogo();
    if (c === undefined) return 'cargando';
    return c && this.elemento() ? 'listo' : 'no-encontrado';
  });

  protected readonly especie = computed<Especie | null>(() => {
    const e = this.elemento();
    return e && {
      tipo: TIPO_CHAT[e.categoria],
      nombreComun: e.nombre,
      nombreCientifico: e.nombreCientifico,
      descripcion: e.descripcion,
      nivelConfianza: 100,
    };
  });
  protected readonly fondo = computed(() => {
    const h = this.elemento()?.habitat;
    return h ? `url("${h}")` : null;
  });

  // --- Modelo 3D ---
  protected readonly visorListo = signal(false);
  protected readonly estadoModelo = signal<EstadoModelo>('cargando');
  protected readonly progreso = signal(0);
  protected readonly puedeAr = signal(false);
  // Con "reducir movimiento" el modelo no gira solo.
  protected readonly autoRotar = signal(!matchMedia('(prefers-reduced-motion: reduce)').matches);
  protected readonly puntoActivo = signal<PuntoAtlas | null>(null);

  // --- Sonido y panel ---
  protected readonly sonando = signal(false);
  protected readonly sonidoError = signal(false);
  protected readonly panelAbierto = signal(matchMedia('(min-width: 1024px)').matches);
  protected readonly chatAbierto = signal(false);

  private visorSolicitado = false;

  constructor() {
    // <model-viewer> pesa ~1 MB: solo se descarga si el elemento tiene modelo.
    effect(() => {
      if (this.elemento()?.modelo) void this.cargarVisor();
    });

    // Al cambiar de elemento se reinicia todo lo que depende del modelo y del sonido.
    effect(() => {
      this.id();
      untracked(() => {
        this.estadoModelo.set('cargando');
        this.progreso.set(0);
        this.puedeAr.set(false);
        this.puntoActivo.set(null);
        this.sonando.set(false);
        this.sonidoError.set(false);
        this.chatAbierto.set(false);
      });
    });

    this.destroyRef.onDestroy(() => this.audio()?.nativeElement.pause());
  }

  private async cargarVisor(): Promise<void> {
    if (this.visorSolicitado) return;
    this.visorSolicitado = true;
    try {
      const { ModelViewerElement } = await import('@google/model-viewer');
      // Decodificador de los .glb comprimidos (meshopt), alojado en el proyecto: sin internet también funciona.
      ModelViewerElement.meshoptDecoderLocation = 'atlas3d/vendor/meshopt_decoder.js';
      this.visorListo.set(true);
    } catch {
      this.estadoModelo.set('error');
    }
  }

  protected alProgresar(e: Event): void {
    this.progreso.set((e as CustomEvent<{ totalProgress: number }>).detail.totalProgress);
  }

  protected alCargar(): void {
    const visor = this.visor()?.nativeElement;
    const e = this.elemento();
    if (!visor || !e) return;
    this.estadoModelo.set('listo');
    this.puedeAr.set(visor.canActivateAR);
    this.crearPuntos(visor, e);
  }

  /** Al tocar o arrastrar el modelo deja de girar solo. */
  protected alMoverCamara(e: Event): void {
    if ((e as CustomEvent<{ source: string }>).detail.source === 'user-interaction') this.autoRotar.set(false);
  }

  protected proyectar(): void {
    void this.visor()?.nativeElement.activateAR().catch(() => this.puedeAr.set(false));
  }

  // Historia y chat comparten la columna: abrir uno pliega el otro.
  protected alternarPanel(): void {
    const abrir = !this.panelAbierto();
    this.panelAbierto.set(abrir);
    if (abrir) this.chatAbierto.set(false);
  }

  protected alternarChat(): void {
    const abrir = !this.chatAbierto();
    this.chatAbierto.set(abrir);
    if (!abrir) return;
    this.panelAbierto.set(false);
    // En pantallas táctiles no se enfoca el campo: el teclado taparía la mitad del chat.
    if (!matchMedia('(pointer: coarse)').matches) afterNextRender(() => this.chat()?.enfocar(), { injector: this.injector });
  }

  protected cerrarChat(): void {
    this.chatAbierto.set(false);
  }

  protected alternarSonido(): void {
    const audio = this.audio()?.nativeElement;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => this.sonidoError.set(true));
    else audio.pause();
  }

  /**
   * Puntos de interés sobre el modelo. Se crean desde código porque <model-viewer> solo registra
   * un hotspot si su `slot` ya está puesto cuando entra al DOM (con un binding de Angular llegaría tarde).
   */
  private crearPuntos(visor: HTMLElement, e: ElementoAtlas): void {
    visor.querySelectorAll('.punto-3d').forEach((n) => n.remove());
    e.puntos.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'punto-3d';
      b.slot = `hotspot-${i}`;
      b.dataset['position'] = p.posicion;
      b.dataset['normal'] = p.normal;
      b.dataset['visibilityAttribute'] = 'visible';
      b.setAttribute('aria-label', p.etiqueta);
      b.title = p.etiqueta;
      b.textContent = String(i + 1);
      b.addEventListener('click', () => this.puntoActivo.set(p));
      visor.append(b);
    });
  }
}
