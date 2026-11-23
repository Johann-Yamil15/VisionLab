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
import { AtlasService, ElementoAtlas, NOMBRE_CATEGORIA, TOKEN_CATEGORIA } from './data-access/atlas';

type EstadoModelo = 'cargando' | 'listo' | 'error';

/** Lo que usamos del elemento <model-viewer> (la librería se carga bajo demanda). */
interface Visor extends HTMLElement {
  canActivateAR: boolean;
  activateAR(): Promise<void>;
  cameraOrbit: string;
  cameraTarget: string;
  getCameraOrbit(): { theta: number; phi: number; radius: number };
  getCameraTarget(): { x: number; y: number; z: number };
  jumpCameraToGoal(): void;
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
  host: { '(document:keydown.escape)': 'cerrarPunto(true)' },
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
  // Punto abierto (índice en e.puntos), los elementos DOM de los puntos y la cámara antes de acercarnos.
  private activo: number | null = null;
  private puntosDom: HTMLElement[] = [];
  private camaraPrevia: { orbit: string; target: string } | null = null;
  private readonly sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        this.activo = null;
        this.camaraPrevia = null;
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
    this.cerrarAlTocarFuera(visor);
  }

  /** Al tocar o arrastrar el modelo deja de girar solo. */
  protected alMoverCamara(e: Event): void {
    if ((e as CustomEvent<{ source: string }>).detail.source !== 'user-interaction') return;
    this.autoRotar.set(false);
    // Si la persona mueve la cámara con la tarjeta abierta, al cerrarla no se le devuelve la vista anterior.
    if (this.activo !== null) this.camaraPrevia = null;
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
    if (audio.paused) {
      // Pausar mientras aún carga aborta el play() (AbortError): no es un archivo dañado, no se oculta el sonido.
      audio.play().catch((err: DOMException) => {
        if (err?.name !== 'AbortError') this.sonidoError.set(true);
      });
    } else {
      audio.pause();
    }
  }

  /**
   * Puntos de interés sobre el modelo. Se crean desde código porque <model-viewer> solo registra
   * un hotspot si su `slot` ya está puesto cuando entra al DOM (con un binding de Angular llegaría tarde).
   * Cada uno es: botón (el punto) + línea + etiqueta + tarjeta con el texto. Como todo vive dentro del hotspot,
   * la tarjeta sigue al modelo al girar y se oculta sola cuando la parte queda detrás (`data-visible`).
   */
  private crearPuntos(visor: HTMLElement, e: ElementoAtlas): void {
    visor.querySelectorAll('.punto-3d').forEach((n) => n.remove());
    this.activo = null;
    const crear = <K extends keyof HTMLElementTagNameMap>(tag: K, clase: string, padre?: HTMLElement) => {
      const el = document.createElement(tag);
      el.className = clase;
      padre?.append(el);
      return el;
    };
    this.puntosDom = e.puntos.map((p, i) => {
      const raiz = crear('div', 'punto-3d');
      raiz.slot = `hotspot-${i}`;
      raiz.dataset['position'] = p.posicion;
      raiz.dataset['normal'] = p.normal;
      raiz.dataset['visibilityAttribute'] = 'visible';
      // Un toque sobre el punto o su tarjeta no debe empezar a girar el modelo.
      raiz.addEventListener('pointerdown', (ev) => ev.stopPropagation());

      const boton = crear('button', 'punto-3d__boton', raiz);
      boton.type = 'button';
      boton.textContent = String(i + 1);
      boton.setAttribute('aria-label', p.etiqueta);
      boton.setAttribute('aria-expanded', 'false');
      boton.setAttribute('aria-controls', `punto-3d-${i}`);
      boton.addEventListener('click', () => this.alternarPunto(i));

      crear('span', 'punto-3d__linea', raiz).setAttribute('aria-hidden', 'true');
      const etiqueta = crear('span', 'punto-3d__etiqueta', raiz);
      etiqueta.textContent = p.etiqueta;
      etiqueta.setAttribute('aria-hidden', 'true'); // el botón ya tiene su aria-label

      const tarjeta = crear('div', 'punto-3d__tarjeta', raiz);
      tarjeta.id = `punto-3d-${i}`;
      tarjeta.hidden = true;
      tarjeta.setAttribute('role', 'region');
      tarjeta.setAttribute('aria-label', p.etiqueta);
      crear('h2', 'punto-3d__titulo', tarjeta).textContent = p.etiqueta;
      crear('p', 'punto-3d__texto', tarjeta).textContent = p.texto;
      const cerrar = crear('button', 'punto-3d__cerrar', tarjeta);
      cerrar.type = 'button';
      cerrar.textContent = '✕';
      cerrar.setAttribute('aria-label', 'Cerrar descripción');
      cerrar.addEventListener('click', () => this.cerrarPunto(true));

      visor.append(raiz);
      return raiz;
    });
  }

  /** Tocar fuera de un punto (sin arrastrar) cierra la tarjeta abierta. */
  private cerrarAlTocarFuera(visor: HTMLElement): void {
    if (visor.dataset['tocarFuera']) return;
    visor.dataset['tocarFuera'] = '1';
    let inicio: [number, number] | null = null;
    visor.addEventListener('pointerdown', (ev) => (inicio = [ev.clientX, ev.clientY]));
    visor.addEventListener('click', (ev) => {
      const movido = inicio ? Math.hypot(ev.clientX - inicio[0], ev.clientY - inicio[1]) : 0;
      if (movido < 6 && !(ev.target as Element).closest('.punto-3d')) this.cerrarPunto();
    });
  }

  private alternarPunto(i: number): void {
    if (this.activo === i) this.cerrarPunto();
    else this.abrirPunto(i);
  }

  private abrirPunto(i: number): void {
    const visor = this.visor()?.nativeElement;
    const p = this.elemento()?.puntos[i];
    const raiz = this.puntosDom[i];
    if (!visor || !p || !raiz) return;
    this.cerrarPunto(false, false); // la tarjeta anterior se cierra sin devolver la cámara
    this.activo = i;
    raiz.classList.add('abierto');
    raiz.querySelector('.punto-3d__boton')?.setAttribute('aria-expanded', 'true');
    raiz.querySelector<HTMLElement>('.punto-3d__tarjeta')!.hidden = false;
    this.autoRotar.set(false);
    this.irAlPunto(visor, p.posicion, p.normal);
  }

  /** Cierra la tarjeta abierta. Con `restaurar` la cámara vuelve a donde estaba; con `devolverFoco` el foco vuelve al punto. */
  protected cerrarPunto(devolverFoco = false, restaurar = true): void {
    if (this.activo === null) return;
    const raiz = this.puntosDom[this.activo];
    raiz.classList.remove('abierto');
    const boton = raiz.querySelector<HTMLElement>('.punto-3d__boton');
    boton?.setAttribute('aria-expanded', 'false');
    raiz.querySelector<HTMLElement>('.punto-3d__tarjeta')!.hidden = true;
    if (devolverFoco) boton?.focus();
    this.activo = null;
    if (restaurar) this.restaurarCamara();
  }

  /** La cámara gira suave hacia la parte: la mira de frente (por su normal) y la pone en el centro. */
  private irAlPunto(visor: Visor, posicion: string, normal: string): void {
    const orbita = visor.getCameraOrbit();
    if (!this.camaraPrevia) {
      const t = visor.getCameraTarget();
      this.camaraPrevia = { orbit: `${orbita.theta}rad ${orbita.phi}rad ${orbita.radius}m`, target: `${t.x}m ${t.y}m ${t.z}m` };
    }
    const [nx, ny, nz] = normal.split(' ').map(parseFloat);
    const phi = Math.min(2.4, Math.max(0.7, Math.acos(Math.max(-1, Math.min(1, ny)))));
    visor.cameraTarget = posicion;
    visor.cameraOrbit = `${Math.atan2(nx, nz)}rad ${phi}rad ${orbita.radius}m`;
    if (this.sinMovimiento) visor.jumpCameraToGoal();
  }

  private restaurarCamara(): void {
    const visor = this.visor()?.nativeElement;
    const previa = this.camaraPrevia;
    this.camaraPrevia = null;
    if (!visor || !previa) return;
    visor.cameraOrbit = previa.orbit;
    visor.cameraTarget = previa.target;
    if (this.sinMovimiento) visor.jumpCameraToGoal();
  }
}
