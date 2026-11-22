import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import Globe, { GlobeInstance } from 'globe.gl';
import { AtlasService, CategoriaAtlas, ElementoAtlas } from './data-access/atlas';

const COLOR: Record<CategoriaAtlas, string> = { fauna: '#f59e0b', flora: '#22c55e', mineral: '#a78bfa' };
const NOMBRE_CATEGORIA: Record<CategoriaAtlas, string> = { fauna: 'Fauna', flora: 'Flora', mineral: 'Mineral' };

/** Atlas Vivo 3D: globo terráqueo con pines de fauna, flora y minerales. */
@Component({
  selector: 'app-atlas-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="atlas" aria-label="Atlas Vivo 3D">
      <div #globo class="globo"></div>

      <header class="titulo">
        <h1>Atlas Vivo 3D</h1>
        <p>Gira el planeta y toca un pin para explorar.</p>
      </header>

      <ul class="leyenda" aria-label="Categorías">
        @for (c of categorias; track c) {
          <li><span class="punto" [style.background]="color[c]"></span>{{ nombreCategoria[c] }}</li>
        }
      </ul>

      @if (seleccionado(); as e) {
        <aside class="seleccion" aria-live="polite">
          <span class="chip" [style.background]="color[e.categoria]">{{ nombreCategoria[e.categoria] }}</span>
          <h2>{{ e.nombre }}</h2>
          @if (e.nombreCientifico) { <p class="cientifico">{{ e.nombreCientifico }}</p> }
          <p class="region">{{ e.region }}</p>
        </aside>
      }
    </section>
  `,
  styleUrl: './atlas.page.scss',
})
export class AtlasPage implements OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly atlas = inject(AtlasService);
  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('globo');
  private globo?: GlobeInstance;
  private resize?: ResizeObserver;

  protected readonly categorias: CategoriaAtlas[] = ['fauna', 'flora', 'mineral'];
  protected readonly color = COLOR;
  protected readonly nombreCategoria = NOMBRE_CATEGORIA;
  protected readonly seleccionado = signal<ElementoAtlas | null>(null);

  constructor() {
    afterNextRender(() => {
      const el = this.contenedor().nativeElement;
      // El render de three.js corre fuera de Angular para no disparar detección de cambios en cada frame.
      // El globo se crea en la primera medición real del contenedor: al cargar directo la URL en el
      // celular, el contenedor aún no tiene su tamaño final y la cámara quedaba demasiado lejos.
      this.zone.runOutsideAngular(() => {
        this.resize = new ResizeObserver(() => {
          if (!el.clientWidth || !el.clientHeight) return;
          if (this.globo) this.globo.width(el.clientWidth).height(el.clientHeight);
          else this.crearGlobo(el);
        });
        this.resize.observe(el);
      });
    });
  }

  private crearGlobo(el: HTMLElement): void {
    this.globo = new Globe(el)
      .globeImageUrl('atlas3d/earth-night.jpg')
      .bumpImageUrl('atlas3d/earth-topology.png')
      .backgroundImageUrl('atlas3d/night-sky.png')
      .atmosphereColor('#60a5fa')
      .width(el.clientWidth)
      .height(el.clientHeight)
      .htmlLat((d) => (d as ElementoAtlas).lat)
      .htmlLng((d) => (d as ElementoAtlas).lng)
      .htmlAltitude(0.01)
      .htmlElement((d) => this.crearPin(d as ElementoAtlas))
      // Oculta (y saca del foco del teclado) los pines del lado oscuro del planeta.
      .htmlElementVisibilityModifier((pin, visible) => {
        pin.style.visibility = visible ? 'visible' : 'hidden';
      });

    const controles = this.globo.controls();
    controles.autoRotate = true;
    controles.autoRotateSpeed = 0.4;
    controles.addEventListener('start', () => (controles.autoRotate = false));
    // En pantallas angostas (celular vertical) se aleja la cámara para que el planeta quepa completo.
    this.globo.pointOfView({ lat: 15, lng: -40, altitude: el.clientWidth < 600 ? 3.6 : 2.4 });
    this.atlas.elementos$.subscribe((elementos) => this.globo?.htmlElementsData(elementos));
  }

  private crearPin(e: ElementoAtlas): HTMLElement {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'atlas-pin';
    pin.style.setProperty('--pin', COLOR[e.categoria]);
    pin.title = e.nombre;
    pin.setAttribute('aria-label', `${e.nombre}, ${NOMBRE_CATEGORIA[e.categoria]}, ${e.region}`);
    const nombre = document.createElement('span');
    nombre.className = 'atlas-pin__nombre';
    nombre.textContent = e.nombre;
    pin.append(nombre);
    pin.addEventListener('click', () => {
      if (!this.globo) return;
      this.globo.controls().autoRotate = false;
      this.globo.pointOfView({ lat: e.lat, lng: e.lng, altitude: 1.6 }, 1000);
      this.zone.run(() => this.seleccionado.set(e));
    });
    return pin;
  }

  ngOnDestroy(): void {
    this.resize?.disconnect();
    this.globo?._destructor();
    this.contenedor().nativeElement.replaceChildren();
  }
}
