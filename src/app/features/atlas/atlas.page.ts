import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import Globe, { GlobeInstance } from 'globe.gl';
import { AppIcons } from '../../shared/ui/icons';
import { AtlasService, CategoriaAtlas, ElementoAtlas } from './data-access/atlas';

const COLOR: Record<CategoriaAtlas, string> = { fauna: '#f59e0b', flora: '#22c55e', mineral: '#a78bfa' };
const NOMBRE_CATEGORIA: Record<CategoriaAtlas, string> = { fauna: 'Fauna', flora: 'Flora', mineral: 'Minerales' };

/** Quita acentos y mayúsculas para que "nenufar" encuentre "Nenúfar". */
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Atlas Vivo 3D: globo terráqueo con pines de fauna, flora y minerales. */
@Component({
  selector: 'app-atlas-page',
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="atlas" [class.atlas--listo]="listo()" aria-label="Atlas Vivo 3D" [attr.aria-busy]="!listo()">
      <div #globo class="globo"></div>

      <!-- Secuencia de arranque: cubre el tiempo en que se descargan las texturas del planeta. -->
      <div class="arranque" aria-hidden="true">
        <div class="arranque-nucleo"></div>
        <ul class="arranque-lineas">
          <li>OMNISCAN · ATLAS VIVO 3D</li>
          <li>Enlazando satélites…</li>
          <li>Cargando cartografía nocturna…</li>
          <li>Sincronizando {{ total() }} registros de campo…</li>
        </ul>
        <div class="arranque-barra"><span></span></div>
      </div>
      @if (!listo()) {
        <p class="sr-only" role="status">Cargando el atlas…</p>
      }

      <header class="titulo">
        <h1>Atlas Vivo 3D</h1>
        <p>Gira el planeta y toca un pin para explorar.</p>
      </header>

      <div class="filtros" role="group" aria-label="Filtrar por categoría">
        @for (c of categorias; track c) {
          <button
            type="button"
            class="filtro"
            [class.activo]="activas().has(c)"
            [attr.aria-pressed]="activas().has(c)"
            [style.--c]="color[c]"
            (click)="alternar(c)"
          >
            <span class="punto"></span>{{ nombreCategoria[c] }}
          </button>
        }
      </div>

      <button
        type="button"
        class="abrir-catalogo"
        [attr.aria-expanded]="catalogoAbierto()"
        aria-controls="atlas-catalogo"
        (click)="catalogoAbierto.set(!catalogoAbierto())"
      >
        <lucide-icon [img]="catalogoAbierto() ? icons.X : icons.Rows3" [size]="20" aria-hidden="true" />
        {{ catalogoAbierto() ? 'Cerrar' : 'Catálogo' }}
      </button>

      <aside id="atlas-catalogo" class="catalogo" [class.abierto]="catalogoAbierto()" aria-label="Catálogo del atlas">
        <label class="buscar">
          <lucide-icon [img]="icons.Search" [size]="18" aria-hidden="true" />
          <span class="sr-only">Buscar en el atlas</span>
          <input
            type="search"
            placeholder="Buscar especie o mineral"
            [value]="busqueda()"
            (input)="busqueda.set($any($event.target).value)"
          />
        </label>

        @for (c of categorias; track c) {
          @if (porCategoria()[c].length) {
            <h2 class="grupo" [style.--c]="color[c]">{{ nombreCategoria[c] }}</h2>
            <ul class="lista">
              @for (e of porCategoria()[c]; track e.id) {
                <li>
                  <button
                    type="button"
                    [class.actual]="seleccionado()?.id === e.id"
                    [attr.aria-current]="seleccionado()?.id === e.id"
                    (click)="seleccionar(e)"
                  >
                    {{ e.nombre }}
                    <small>{{ e.region }}</small>
                  </button>
                </li>
              }
            </ul>
          }
        }
        @if (!visibles().length) {
          <p class="vacio">No hay resultados.</p>
        }
      </aside>

      @if (seleccionado(); as e) {
        <article class="ficha" aria-live="polite">
          <button type="button" class="cerrar" aria-label="Cerrar ficha" (click)="seleccionado.set(null)">
            <lucide-icon [img]="icons.X" [size]="18" aria-hidden="true" />
          </button>
          @if (e.miniatura) {
            <img class="miniatura" [src]="e.miniatura" [alt]="e.nombre" />
          }
          <span class="cat" [style.background]="color[e.categoria]">{{ nombreCategoria[e.categoria] }}</span>
          <h2>{{ e.nombre }}</h2>
          @if (e.nombreCientifico) {
            <p class="cientifico">{{ e.nombreCientifico }}</p>
          }
          <dl class="datos">
            <div>
              <dt>Región</dt>
              <dd>{{ e.region }}</dd>
            </div>
            @if (e.estatus) {
              <div>
                <dt>Estado de conservación</dt>
                <dd>{{ e.estatus }}</dd>
              </div>
            }
          </dl>
          <p class="descripcion">{{ e.descripcion }}</p>
          @if (e.modelo) {
            <a class="explorar" [routerLink]="['/atlas', e.id]">
              <lucide-icon [img]="icons.Maximize2" [size]="18" aria-hidden="true" />
              Explorar en 3D
            </a>
          } @else {
            <p class="pronto">Modelo 3D en preparación.</p>
          }
        </article>
      }
    </section>
  `,
  styleUrl: './atlas.page.scss',
})
export class AtlasPage implements OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('globo');
  private globo?: GlobeInstance;
  private resize?: ResizeObserver;

  protected readonly icons = AppIcons;
  protected readonly categorias: CategoriaAtlas[] = ['fauna', 'flora', 'mineral'];
  protected readonly color = COLOR;
  protected readonly nombreCategoria = NOMBRE_CATEGORIA;

  private readonly elementos = toSignal(inject(AtlasService).elementos$, { initialValue: [] });
  protected readonly activas = signal(new Set<CategoriaAtlas>(this.categorias));
  protected readonly busqueda = signal('');
  protected readonly seleccionado = signal<ElementoAtlas | null>(null);
  /** true cuando el planeta ya tiene sus texturas y empieza la animación de entrada. */
  protected readonly listo = signal(false);
  protected readonly total = computed(() => this.elementos().length || '…');
  // El catálogo empieza cerrado para que la entrada del planeta luzca completa.
  protected readonly catalogoAbierto = signal(false);

  /** Elementos que pasan los filtros: alimentan tanto los pines como la lista. */
  protected readonly visibles = computed(() => {
    const q = normalizar(this.busqueda().trim());
    return this.elementos().filter(
      (e) =>
        this.activas().has(e.categoria) &&
        (!q || normalizar(`${e.nombre} ${e.nombreCientifico} ${e.region}`).includes(q)),
    );
  });

  protected readonly porCategoria = computed(() => {
    const grupos: Record<CategoriaAtlas, ElementoAtlas[]> = { fauna: [], flora: [], mineral: [] };
    for (const e of this.visibles()) grupos[e.categoria].push(e);
    return grupos;
  });

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

    // Los pines siguen a los filtros. Si lo seleccionado queda filtrado, se cierra su ficha.
    effect(() => {
      const visibles = this.visibles();
      this.globo?.htmlElementsData(visibles);
      const actual = this.seleccionado();
      if (actual && !visibles.includes(actual)) this.seleccionado.set(null);
    });
  }

  protected alternar(c: CategoriaAtlas): void {
    const activas = new Set(this.activas());
    if (activas.has(c)) activas.delete(c);
    else activas.add(c);
    this.activas.set(activas);
  }

  protected seleccionar(e: ElementoAtlas): void {
    this.seleccionado.set(e);
    if (!matchMedia('(min-width: 1024px)').matches) this.catalogoAbierto.set(false);
    if (!this.globo) return;
    this.globo.controls().autoRotate = false;
    this.globo.pointOfView({ lat: e.lat, lng: e.lng, altitude: 1.6 }, 1000);
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
      })
      .htmlElementsData(this.visibles());

    const controles = this.globo.controls();
    controles.autoRotateSpeed = 0.4;
    controles.addEventListener('start', () => (controles.autoRotate = false));

    // Entrada: la cámara arranca muy lejos (el planeta es un punto al centro) y se acerca girando
    // hasta su lugar. En pantallas angostas (celular vertical) queda más lejos para que quepa completo.
    const destino = { lat: 15, lng: -40, altitude: el.clientWidth < 600 ? 3.6 : 2.4 };
    this.globo.pointOfView({ lat: 5, lng: -160, altitude: 18 });

    const inicio = performance.now();
    let entro = false;
    const entrar = () => {
      if (entro || !this.globo) return;
      entro = true;
      // La secuencia de arranque se ve al menos 1.4 s aunque las texturas ya estén en caché.
      const espera = Math.max(0, 1400 - (performance.now() - inicio));
      setTimeout(() => {
        if (!this.globo) return;
        const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const duracion = sinMovimiento ? 0 : 2600;
        this.globo.pointOfView(destino, duracion);
        setTimeout(() => (controles.autoRotate = true), duracion);
        this.zone.run(() => this.listo.set(true));
      }, espera);
    };
    this.globo.onGlobeReady(entrar);
    // Si alguna textura falla, no se queda atorado en la pantalla de carga.
    setTimeout(entrar, 8000);
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
    pin.addEventListener('click', () => this.zone.run(() => this.seleccionar(e)));
    return pin;
  }

  ngOnDestroy(): void {
    this.resize?.disconnect();
    this.globo?._destructor();
    this.globo = undefined; // los temporizadores de la entrada revisan esto antes de mover la cámara
    this.contenedor().nativeElement.replaceChildren();
  }
}
