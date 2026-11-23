import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, NgZone } from '@angular/core';
import type { GlobeInstance } from 'globe.gl';

type Punto = { lat: number; lng: number };
type Arco = { inicio: Punto; fin: Punto };

/** Globo con la ruta migratoria de una especie, sobre fondo transparente (deja ver el hábitat). */
@Component({
  selector: 'app-migracion-globo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  styles: ':host { display: block; }',
})
export class MigracionGloboComponent {
  readonly ruta = input.required<Punto[]>();
  readonly color = input('#f59e0b');

  private globo?: GlobeInstance;

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const zone = inject(NgZone);
    let destruido = false;
    const resize = new ResizeObserver(() => this.globo?.width(el.clientWidth).height(el.clientHeight));
    inject(DestroyRef).onDestroy(() => {
      destruido = true;
      resize.disconnect();
      this.globo?._destructor();
    });

    afterNextRender(() =>
      zone.runOutsideAngular(async () => {
        const { default: Globe } = await import('globe.gl');
        if (destruido) return;
        const ruta = this.ruta();
        const arcos: Arco[] = ruta.slice(1).map((fin, i) => ({ inicio: ruta[i], fin }));
        const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.globo = new Globe(el)
          .backgroundColor('rgba(0,0,0,0)')
          .globeImageUrl('atlas3d/earth-night.jpg')
          .bumpImageUrl('atlas3d/earth-topology.png')
          .atmosphereColor('#93c5fd')
          .width(el.clientWidth)
          .height(el.clientHeight)
          .arcStartLat((a) => (a as Arco).inicio.lat)
          .arcStartLng((a) => (a as Arco).inicio.lng)
          .arcEndLat((a) => (a as Arco).fin.lat)
          .arcEndLng((a) => (a as Arco).fin.lng)
          .arcColor(() => ['rgba(255,255,255,0.3)', this.color()])
          .arcStroke(1)
          .arcAltitudeAutoScale(0.35)
          .arcDashLength(0.35)
          .arcDashGap(0.15)
          .arcDashAnimateTime(quieto ? 0 : 3000)
          .arcsData(arcos)
          .pointLat((p) => (p as Punto).lat)
          .pointLng((p) => (p as Punto).lng)
          .pointColor(() => this.color())
          .pointAltitude(0.01)
          .pointRadius(0.6)
          .pointsData(ruta);
        this.globo.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        // La cámara mira al centro de la ruta.
        const lat = ruta.reduce((s, p) => s + p.lat, 0) / ruta.length;
        const lng = ruta.reduce((s, p) => s + p.lng, 0) / ruta.length;
        // Rutas cortas (el elefante recorre ~300 km) piden acercar más la cámara.
        const span = Math.max(...ruta.map((p) => Math.max(Math.abs(p.lat - lat), Math.abs(p.lng - lng))));
        this.globo.pointOfView({ lat, lng, altitude: Math.min(1.8, Math.max(0.35, span / 8)) }, quieto ? 0 : 1500);
        resize.observe(el);
      }),
    );
  }
}
