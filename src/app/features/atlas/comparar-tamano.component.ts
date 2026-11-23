import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, NgZone, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ElementoAtlas } from './data-access/atlas';

const PERSONA = 1.7;
const MANIQUI = 'atlas3d/models/maniqui.glb';
const TEXTO = { alto: 'de alto', largo: 'de largo', diametro: 'de diámetro' } as const;

/**
 * Escena 3D con la especie y un maniquí de 1.70 m a la MISMA escala real, uno junto al otro.
 * Usa three.js directo (model-viewer solo carga un modelo); el fondo es transparente para ver el hábitat.
 */
@Component({
  selector: 'app-comparar-tamano',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #lienzo aria-hidden="true"></canvas>
    @if (elemento().tamano; as t) {
      <p class="leyenda clay" role="status">
        @if (cargando()) { Cargando comparación… }
        @else {
          <strong>{{ elemento().nombre }}</strong>: {{ t.metros | number: '1.0-1' }} m {{ texto[t.medida] }}
          @if (t.metros / 1.7 >= 1.5) { · como <strong>{{ t.metros / 1.7 | number: '1.0-0' }} personas</strong> }
          · persona: 1.70 m
        }
      </p>
    }
  `,
  styles: `
    :host { display: block; }
    canvas { width: 100%; height: 100%; display: block; touch-action: none; }
    .leyenda { position: absolute; left: 50%; bottom: var(--s-5); transform: translateX(-50%); padding: var(--s-2) var(--s-4); text-align: center; max-width: calc(100% - 2 * var(--s-4)); }
  `,
})
export class CompararTamanoComponent {
  readonly elemento = input.required<ElementoAtlas>();
  protected readonly cargando = signal(true);
  protected readonly texto = TEXTO;
  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');

  constructor() {
    const zone = inject(NgZone);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let limpiar = () => {};
    let destruido = false;
    inject(DestroyRef).onDestroy(() => {
      destruido = true;
      limpiar();
    });

    afterNextRender(() =>
      zone.runOutsideAngular(async () => {
        const [THREE, { GLTFLoader }, { OrbitControls }, { MeshoptDecoder }] = await Promise.all([
          // @ts-expect-error three no trae tipos; un shim global de 'three' rompería los tipos de globe.gl.
          import('three'),
          import('three/examples/jsm/loaders/GLTFLoader.js'),
          import('three/examples/jsm/controls/OrbitControls.js'),
          import('three/examples/jsm/libs/meshopt_decoder.module.js'),
        ]);
        const e = this.elemento();
        const t = e.tamano;
        if (destruido || !t || !e.modelo) return;

        const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
        const [especie, maniqui] = await Promise.all([loader.loadAsync(e.modelo), loader.loadAsync(MANIQUI)]);
        if (destruido) return;

        // Escala a metros reales y apoya en el suelo (y = 0).
        const ajustar = (obj: any, metros: number, medida: 'alto' | 'largo' | 'diametro') => {
          const caja = new THREE.Box3().setFromObject(obj);
          const d = caja.getSize(new THREE.Vector3());
          const actual = medida === 'alto' ? d.y : Math.max(d.x, d.z);
          obj.scale.multiplyScalar(metros / actual);
          const c2 = new THREE.Box3().setFromObject(obj);
          obj.position.y -= c2.min.y;
          return c2;
        };
        // De perfil: el eje largo de la especie queda a lo ancho de la pantalla.
        const d0 = new THREE.Box3().setFromObject(especie.scene).getSize(new THREE.Vector3());
        if (d0.z > d0.x) especie.scene.rotation.y = Math.PI / 2;
        const cajaE = ajustar(especie.scene, t.metros, t.medida);
        const cajaM = ajustar(maniqui.scene, PERSONA, 'alto');

        // Persona a la izquierda de la especie, con un pequeño hueco.
        const anchoE = cajaE.max.x - cajaE.min.x;
        const centroE = (cajaE.max.x + cajaE.min.x) / 2;
        especie.scene.position.x -= centroE;
        const anchoM = cajaM.max.x - cajaM.min.x;
        maniqui.scene.position.x = -anchoE / 2 - anchoM / 2 - Math.max(0.4, anchoE * 0.05) - (cajaM.max.x + cajaM.min.x) / 2;

        const escena = new THREE.Scene();
        escena.add(especie.scene, maniqui.scene);
        escena.add(new THREE.HemisphereLight(0xffffff, 0x445566, 2.2));
        const sol = new THREE.DirectionalLight(0xffffff, 2);
        sol.position.set(5, 10, 7);
        escena.add(sol);

        const total = new THREE.Box3().setFromObject(escena);
        const tam = total.getSize(new THREE.Vector3());
        const centro = total.getCenter(new THREE.Vector3());
        const camara = new THREE.PerspectiveCamera(35, 1, 0.01, 5000);
        const tanV = Math.tan((35 * Math.PI) / 360);
        // Distancia para que todo quepa a lo alto y a lo ancho (depende de la proporción del lienzo).
        const encuadrar = (aspecto: number) => {
          const dist = Math.max(tam.y / 2 / tanV, tam.x / 2 / (tanV * aspecto)) * 1.25 + tam.z / 2;
          camara.position.set(centro.x, centro.y + tam.y * 0.1, centro.z + dist);
        };

        const canvas = this.lienzo().nativeElement;
        const render = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        render.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        render.outputColorSpace = THREE.SRGBColorSpace;

        const controles = new OrbitControls(camara, canvas);
        controles.target.copy(centro);
        controles.enableDamping = true;
        controles.maxPolarAngle = Math.PI / 2;
        controles.update();

        const medir = () => {
          const w = host.clientWidth || 1, h = host.clientHeight || 1;
          render.setSize(w, h, false);
          camara.aspect = w / h;
          camara.updateProjectionMatrix();
          encuadrar(w / h);
        };
        medir();
        const obs = new ResizeObserver(medir);
        obs.observe(host);

        let frame = 0;
        const bucle = () => {
          frame = requestAnimationFrame(bucle);
          controles.update();
          render.render(escena, camara);
        };
        bucle();
        zone.run(() => this.cargando.set(false));

        limpiar = () => {
          cancelAnimationFrame(frame);
          obs.disconnect();
          controles.dispose();
          render.dispose();
        };
      }),
    );
  }
}
