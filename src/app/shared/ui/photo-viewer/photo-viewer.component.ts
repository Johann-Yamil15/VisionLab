import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AppIcons } from '../icons';

const ZOOM = { min: 1, max: 6, paso: 1.4, dobleToque: 2.5 };
const PASO_TECLADO = 60;

/**
 * Visor de foto a pantalla completa con zoom (pellizco, rueda, doble toque, botones y teclado)
 * y arrastre para moverse por la foto ampliada.
 */
@Component({
  selector: 'app-photo-viewer',
  imports: [LucideAngularModule],
  templateUrl: './photo-viewer.component.html',
  styleUrl: './photo-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class PhotoViewerComponent {
  readonly src = input.required<string>();
  readonly titulo = input('Foto');
  readonly cerrar = output<void>();

  private readonly document = inject(DOCUMENT);
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly img = viewChild.required<ElementRef<HTMLImageElement>>('img');
  private readonly closeBtn = viewChild.required<ElementRef<HTMLButtonElement>>('closeBtn');

  protected readonly icons = AppIcons;
  protected readonly zoom = ZOOM;
  protected readonly escala = signal(1);
  protected readonly x = signal(0);
  protected readonly y = signal(0);
  protected readonly arrastrando = signal(false);
  protected readonly transform = computed(
    () => `translate3d(${this.x()}px, ${this.y()}px, 0) scale(${this.escala()})`,
  );
  protected readonly porcentaje = computed(() => `${Math.round(this.escala() * 100)}%`);

  private readonly punteros = new Map<number, { x: number; y: number }>();
  private pinch: { distancia: number; escala: number } | null = null;
  private ultimoToque = 0;
  private ultimoDobleTactil = 0;

  constructor() {
    // Bloquea el scroll de la página y devuelve el foco al cerrar.
    const previo = this.document.activeElement as HTMLElement | null;
    const overflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    afterNextRender(() => this.closeBtn().nativeElement.focus());

    inject(DestroyRef).onDestroy(() => {
      this.document.body.style.overflow = overflow;
      previo?.focus?.();
    });
  }

  // ---------- Acciones ----------
  protected acercar(): void {
    this.zoomEn(this.escala() * ZOOM.paso);
  }

  protected alejar(): void {
    this.zoomEn(this.escala() / ZOOM.paso);
  }

  protected restablecer(): void {
    this.escala.set(1);
    this.x.set(0);
    this.y.set(0);
  }

  /** Cambia el zoom manteniendo fijo el punto (cx, cy) relativo al centro del visor. */
  private zoomEn(nueva: number, cx = 0, cy = 0): void {
    const anterior = this.escala();
    const escala = Math.min(ZOOM.max, Math.max(ZOOM.min, nueva));
    const f = escala / anterior;
    this.escala.set(escala);
    this.mover(cx - (cx - this.x()) * f, cy - (cy - this.y()) * f);
  }

  /** Mueve la foto sin dejar que se salga del visor. */
  private mover(x: number, y: number): void {
    const img = this.img().nativeElement;
    const stage = this.stage().nativeElement;
    const s = this.escala();
    const maxX = Math.max(0, (img.offsetWidth * s - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * s - stage.clientHeight) / 2);
    this.x.set(Math.min(maxX, Math.max(-maxX, x)));
    this.y.set(Math.min(maxY, Math.max(-maxY, y)));
  }

  /** Coordenadas del evento relativas al centro del visor. */
  private relativo(clientX: number, clientY: number): [number, number] {
    const r = this.stage().nativeElement.getBoundingClientRect();
    return [clientX - r.left - r.width / 2, clientY - r.top - r.height / 2];
  }

  // ---------- Mouse / táctil ----------
  protected onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.zoomEn(this.escala() * (e.deltaY < 0 ? 1.15 : 1 / 1.15), ...this.relativo(e.clientX, e.clientY));
  }

  /** dblclick del mouse; se ignora si el doble toque táctil ya lo manejó. */
  protected onDobleClick(e: MouseEvent): void {
    if (Date.now() - this.ultimoDobleTactil > 500) this.onDoble(e);
  }

  private onDoble(e: MouseEvent): void {
    if (this.escala() > 1) this.restablecer();
    else this.zoomEn(ZOOM.dobleToque, ...this.relativo(e.clientX, e.clientY));
  }

  protected onPointerDown(e: PointerEvent): void {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.punteros.size === 2) {
      this.pinch = { distancia: this.distancia(), escala: this.escala() };
    } else if (e.pointerType === 'touch') {
      // Doble toque en pantallas táctiles (dblclick no siempre llega).
      const ahora = Date.now();
      if (ahora - this.ultimoToque < 300) {
        this.ultimoDobleTactil = ahora;
        this.onDoble(e);
      }
      this.ultimoToque = ahora;
    }
    this.arrastrando.set(this.escala() > 1);
  }

  protected onPointerMove(e: PointerEvent): void {
    const previo = this.punteros.get(e.pointerId);
    if (!previo) return;
    this.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.punteros.size === 2 && this.pinch) {
      const [a, b] = [...this.punteros.values()];
      const centro = this.relativo((a.x + b.x) / 2, (a.y + b.y) / 2);
      this.zoomEn(this.pinch.escala * (this.distancia() / this.pinch.distancia), ...centro);
    } else if (this.punteros.size === 1 && this.escala() > 1) {
      this.mover(this.x() + e.clientX - previo.x, this.y() + e.clientY - previo.y);
    }
  }

  protected onPointerUp(e: PointerEvent): void {
    this.punteros.delete(e.pointerId);
    if (this.punteros.size < 2) this.pinch = null;
    if (this.punteros.size === 0) this.arrastrando.set(false);
  }

  private distancia(): number {
    const [a, b] = [...this.punteros.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // ---------- Teclado ----------
  protected onKey(e: KeyboardEvent): void {
    const acciones: Record<string, () => void> = {
      Escape: () => this.cerrar.emit(),
      '+': () => this.acercar(),
      '=': () => this.acercar(),
      '-': () => this.alejar(),
      '0': () => this.restablecer(),
      ArrowLeft: () => this.mover(this.x() + PASO_TECLADO, this.y()),
      ArrowRight: () => this.mover(this.x() - PASO_TECLADO, this.y()),
      ArrowUp: () => this.mover(this.x(), this.y() + PASO_TECLADO),
      ArrowDown: () => this.mover(this.x(), this.y() - PASO_TECLADO),
    };
    const accion = acciones[e.key];
    if (!accion) return;
    e.preventDefault();
    accion();
  }
}
