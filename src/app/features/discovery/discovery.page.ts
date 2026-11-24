import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HallazgosService } from '../../shared/data-access/hallazgos.service';
import { NuevoHallazgo, OpcionAnalisis } from '../../shared/models/hallazgo.model';
import { AppIcons } from '../../shared/ui/icons';
import { ExpertChatComponent } from '../../shared/ui/expert-chat/expert-chat.component';
import { SpeciesCardComponent } from '../../shared/ui/species-card/species-card.component';
import { PhotoViewerComponent } from '../../shared/ui/photo-viewer/photo-viewer.component';
import { buscarEnAtlas } from '../../shared/utils/atlas-match';
// Excepción a "un feature no importa de otro" (como captura.store): el catálogo del Atlas se lee una sola vez.
import { AtlasService } from '../atlas/data-access/atlas';
import { CapturaStore } from '../microscope/data-access/captura.store';
import { ToastService } from '../../shared/ui/toast/toast.service';

type Guardado = 'guardando' | 'guardado' | 'error';

/** Con menos confianza que esto la IA ofrece 3 opciones y el usuario elige (igual que el backend). */
const UMBRAL_CONFIANZA = 60;

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

@Component({
  selector: 'app-discovery-page',
  imports: [RouterLink, LucideAngularModule, SpeciesCardComponent, ExpertChatComponent, PhotoViewerComponent],
  templateUrl: './discovery.page.html',
  styleUrl: './discovery.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoveryPage {
  protected readonly store = inject(CapturaStore);
  private readonly hallazgos = inject(HallazgosService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly atlas = toSignal(inject(AtlasService).elementos$, { initialValue: [] });

  protected readonly icons = AppIcons;
  protected readonly foto = this.store.foto();
  protected readonly resultado = computed(() => this.store.resultado());
  protected readonly fotoAbierta = signal(false);
  /** Capturas de la especie tras guardar; > 1 = repetida. */
  protected readonly veces = signal(1);
  protected readonly guardado = signal<Guardado>(this.store.guardadoId() ? 'guardado' : 'guardando');

  /** Confianza baja con opciones: no se guarda nada hasta que el usuario elija. */
  protected readonly eligiendo = computed(() => {
    const r = this.resultado();
    return !!r && r.nivelConfianza < UMBRAL_CONFIANZA && (r.opciones?.length ?? 0) > 0;
  });

  /** Elemento del Atlas que coincide con lo identificado (null → no se muestra el botón). */
  protected readonly enAtlas = computed(() => {
    const r = this.resultado();
    return r && !this.eligiendo() ? (buscarEnAtlas(this.atlas(), r.nombreComun, r.nombreCientifico) ?? null) : null;
  });

  /** Misma regla que el backend: 10 puntos + 1 por cada 10% de confianza. */
  protected readonly puntos = computed(() => 10 + Math.round((this.resultado()?.nivelConfianza ?? 0) / 10));

  constructor() {
    if (!this.resultado() || !this.foto) {
      this.router.navigate(['/microscopio'], { replaceUrl: true });
      return;
    }
    if (!this.eligiendo() && !this.store.guardadoId()) this.guardar();
  }

  /** El usuario eligió una de las opciones: esa es la que se guarda. */
  protected elegir(opcion: OpcionAnalisis): void {
    const r = this.resultado();
    if (!r) return;

    const esLaPrimeraIdea = sinAcentos(opcion.nombreComun) === sinAcentos(r.nombreComun);
    this.store.setResultado(
      esLaPrimeraIdea
        ? { ...r, tipo: opcion.tipo || r.tipo, opciones: [] }
        : {
            // Los detalles eran de otra especie: se descartan en vez de mostrar datos equivocados.
            tipo: opcion.tipo || r.tipo,
            nombreComun: opcion.nombreComun,
            nombreCientifico: opcion.nombreCientifico,
            descripcion: `Elegiste ${opcion.nombreComun} entre las opciones de la IA. ¡Pregúntale al experto para saber más!`,
            nivelConfianza: r.nivelConfianza,
            opciones: [],
          },
    );
    this.guardar();
  }

  protected guardar(): void {
    const r = this.resultado();
    if (!r || !this.foto) return;
    this.guardado.set('guardando');

    // Solo lo que guarda el servidor (amenazas, impacto, peligro y opciones son solo de la ficha en pantalla).
    const nuevo: NuevoHallazgo = {
      tipo: r.tipo,
      nombreComun: r.nombreComun,
      nombreCientifico: r.nombreCientifico,
      descripcion: r.descripcion,
      nivelConfianza: r.nivelConfianza,
      habitat: r.habitat,
      alimentacion: r.alimentacion,
      colores: r.colores,
      tamano: r.tamano,
      lema: r.lema,
      grupoAtlas: r.grupoAtlas,
      region: r.region,
      latitud: r.latitud,
      longitud: r.longitud,
      imagenBase64: this.foto,
    };

    this.hallazgos
      .crear(nuevo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (h) => {
          this.store.marcarGuardado(h.id);
          this.veces.set(h.progreso?.veces ?? 1);
          this.guardado.set('guardado');
          this.toasts.celebrar(h.progreso);
        },
        error: () => this.guardado.set('error'),
      });
  }

  protected explorarOtraVez(): void {
    this.store.limpiar();
    this.router.navigate(['/microscopio']);
  }
}
