import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AppIcons } from '../../shared/ui/icons';
import { CameraService } from './data-access/camera.service';
import { CapturaStore } from './data-access/captura.store';

type Estado = 'encendiendo' | 'lista' | 'sin-camara';

const ZOOM_DIGITAL = { min: 1, max: 4, step: 0.1 };

@Component({
  selector: 'app-microscope-page',
  imports: [LucideAngularModule],
  templateUrl: './microscope.page.html',
  styleUrl: './microscope.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MicroscopePage implements AfterViewInit {
  private readonly camera = inject(CameraService);
  private readonly store = inject(CapturaStore);
  private readonly router = inject(Router);

  protected readonly icons = AppIcons;
  protected readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  protected readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly estado = signal<Estado>('encendiendo');
  protected readonly mensajeError = signal('');
  protected readonly zoom = signal(1);
  protected readonly zoomRango = signal(ZOOM_DIGITAL);
  protected readonly zoomHardware = signal(false);
  protected readonly torchDisponible = signal(false);
  protected readonly torch = signal(false);
  protected readonly flash = signal(false);
  protected readonly procesando = signal(false);

  /** Con zoom digital el video se amplía con CSS; con zoom de hardware lo hace la cámara. */
  protected readonly escalaVideo = computed(() => (this.zoomHardware() ? 1 : this.zoom()));
  protected readonly zoomTexto = computed(() => `${this.zoom().toFixed(1)}×`);

  // Gestos de pellizco (pinch) sobre la lente.
  private readonly punteros = new Map<number, PointerEvent>();
  private distanciaInicial = 0;
  private zoomInicial = 1;
  private destruido = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destruido = true;
      this.camera.stop();
    });
  }

  ngAfterViewInit(): void {
    this.encender();
  }

  async encender(): Promise<void> {
    if (!this.camera.disponible) {
      this.fallar('Este navegador no permite usar la cámara. Puedes subir una foto.');
      return;
    }

    this.estado.set('encendiendo');
    try {
      const stream = await this.camera.start();
      if (this.destruido) return this.camera.stop();

      // Al reintentar desde "sin cámara" el <video> se vuelve a pintar: esperamos un cuadro.
      if (!this.video()) await new Promise((r) => requestAnimationFrame(r));
      const el = this.video()!.nativeElement;
      el.srcObject = stream;
      await el.play();

      const caps = this.camera.capabilities();
      this.torchDisponible.set(caps.torch);
      this.zoomHardware.set(!!caps.zoom);
      if (caps.zoom) {
        this.zoomRango.set({ min: caps.zoom.min, max: Math.min(caps.zoom.max, 10), step: caps.zoom.step || 0.1 });
        this.zoom.set(caps.zoom.min);
      }
      this.estado.set('lista');
    } catch (err) {
      const negado = err instanceof DOMException && err.name === 'NotAllowedError';
      this.fallar(
        negado
          ? 'Necesitamos permiso para usar la cámara. Actívalo en tu navegador o sube una foto.'
          : 'No encontramos una cámara disponible. Puedes subir una foto.',
      );
    }
  }

  protected async cambiarZoom(valor: number): Promise<void> {
    const { min, max } = this.zoomRango();
    const v = Math.round(Math.min(max, Math.max(min, valor)) * 10) / 10;
    this.zoom.set(v);
    if (this.zoomHardware()) {
      await this.camera.setZoom(v).catch(() => this.zoomHardware.set(false));
    }
  }

  protected pasoZoom(direccion: 1 | -1): void {
    const { max, min } = this.zoomRango();
    this.cambiarZoom(this.zoom() + direccion * Math.max(0.5, (max - min) / 8));
  }

  protected async alternarLinterna(): Promise<void> {
    const on = !this.torch();
    try {
      await this.camera.setTorch(on);
      this.torch.set(on);
    } catch {
      this.torchDisponible.set(false);
    }
  }

  protected capturar(): void {
    const el = this.video()?.nativeElement;
    if (!el || this.estado() !== 'lista') return;

    this.flash.set(true);
    setTimeout(() => this.flash.set(false), 250);

    const foto = this.camera.capture(el, this.escalaVideo());
    if (foto) this.irAVistaPrevia(foto);
  }

  protected abrirGaleria(): void {
    this.fileInput().nativeElement.click();
  }

  protected async archivoElegido(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.procesando.set(true);
    try {
      this.irAVistaPrevia(await this.camera.fromFile(file));
    } catch {
      this.mensajeError.set('No pudimos abrir esa imagen. Intenta con otra.');
    } finally {
      this.procesando.set(false);
    }
  }

  // --- Pinch zoom ---
  protected onPointerDown(e: PointerEvent): void {
    this.punteros.set(e.pointerId, e);
    if (this.punteros.size === 2) {
      this.distanciaInicial = this.distancia();
      this.zoomInicial = this.zoom();
    }
  }

  protected onPointerMove(e: PointerEvent): void {
    if (!this.punteros.has(e.pointerId)) return;
    this.punteros.set(e.pointerId, e);
    if (this.punteros.size === 2 && this.distanciaInicial > 0) {
      this.cambiarZoom(this.zoomInicial * (this.distancia() / this.distanciaInicial));
    }
  }

  protected onPointerUp(e: PointerEvent): void {
    this.punteros.delete(e.pointerId);
    if (this.punteros.size < 2) this.distanciaInicial = 0;
  }

  private distancia(): number {
    const [a, b] = [...this.punteros.values()];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  private irAVistaPrevia(foto: string): void {
    this.store.nuevaFoto(foto);
    this.router.navigate(['/microscopio/vista-previa']);
  }

  private fallar(mensaje: string): void {
    this.camera.stop();
    this.mensajeError.set(mensaje);
    this.estado.set('sin-camara');
  }
}
