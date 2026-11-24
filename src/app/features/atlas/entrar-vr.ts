import { COLOR_CATEGORIA, ElementoAtlas, NOMBRE_CATEGORIA } from './data-access/atlas';

/**
 * Realidad virtual inmersiva (visores como Quest): el Atlas web, pero estando dentro.
 * - Planeta: el globo flota frente a ti con los pines; apuntas a uno y aprietas el gatillo para entrar.
 * - Especie: rodeado de su hábitat, el modelo flota frente a ti (se gira arrastrando con el gatillo), puntos numerados
 *   con su explicación, ficha, sonido, migración (el globo toma el lugar del modelo) y tamaño real junto a un maniquí.
 * Sin `inicial` empieza en el planeta; con él, directo en esa especie.
 *
 * La sesión se pide ANTES de cargar three.js: el navegador solo la concede durante el clic.
 */
export async function entrarVr(inicial?: ElementoAtlas): Promise<void> {
  const xr = (navigator as Navigator & { xr?: any }).xr;
  const sesion = await xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });

  const url = (ruta: string) => new URL(ruta, document.baseURI).href;
  const [THREE, { GLTFLoader }, { MeshoptDecoder }, catalogo] = await Promise.all([
    // @ts-expect-error three no trae tipos; un shim global de 'three' rompería los tipos de globe.gl.
    import('three'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js'),
    // Solo el catálogo fijo: las especies personales no tienen modelo 3D.
    fetch(url('atlas3d/atlas.json')).then((r) => r.json() as Promise<ElementoAtlas[]>).then((l) => l.filter((x) => x.modelo)),
  ]);

  const render = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true });
  render.outputColorSpace = THREE.SRGBColorSpace;
  render.xr.enabled = true;
  render.xr.setReferenceSpaceType('local-floor');

  const escena = new THREE.Scene();
  escena.add(new THREE.HemisphereLight(0xffffff, 0x445544, 2.5));
  const sol = new THREE.DirectionalLight(0xffffff, 2);
  sol.position.set(5, 10, 3);
  escena.add(sol);
  const camara = new THREE.PerspectiveCamera(70, 1, 0.05, 500);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const texturas = new THREE.TextureLoader();
  const VISTA = new THREE.Vector3(0, 1.45, -2.6); // donde flota lo que se está viendo (modelo o globo)
  const verde = '#15803d';
  const tinta = '#1f3d2b';

  // ---------- Utilidades de dibujo: lienzo → textura ----------
  function cartel(anchoPx: number, altoPx: number, anchoM: number, dibujar: (g: CanvasRenderingContext2D) => void) {
    const lienzo = document.createElement('canvas');
    lienzo.width = anchoPx;
    lienzo.height = altoPx;
    const g = lienzo.getContext('2d')!;
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, transparent: true }));
    sprite.scale.set(anchoM, (anchoM * altoPx) / anchoPx, 1);
    const pintar = (d = dibujar) => {
      g.clearRect(0, 0, anchoPx, altoPx);
      d(g);
      textura.needsUpdate = true;
    };
    pintar();
    return { sprite, pintar };
  }
  function caja(g: CanvasRenderingContext2D, w: number, h: number, fondo: string) {
    g.fillStyle = tinta;
    g.beginPath();
    g.roundRect(0, 0, w, h, 36);
    g.fill();
    g.fillStyle = fondo;
    g.beginPath();
    g.roundRect(6, 6, w - 12, h - 12, 30);
    g.fill();
  }
  /** Texto con salto de línea automático; devuelve la y siguiente. */
  function parrafo(g: CanvasRenderingContext2D, texto: string, x: number, y: number, ancho: number, alto: number): number {
    let linea = '';
    for (const palabra of texto.split(' ')) {
      if (g.measureText(linea + palabra).width > ancho && linea) {
        g.fillText(linea, x, y);
        y += alto;
        linea = '';
      }
      linea += palabra + ' ';
    }
    g.fillText(linea, x, y);
    return y + alto;
  }
  /** Píldora con texto (etiquetas de pines y de puntos), con círculo opcional a la izquierda. */
  function pildora(texto: string, circulo?: { color: string; texto: string }) {
    const c = cartel(640, 128, 0.5, (g) => {
      g.font = 'bold 52px sans-serif';
      g.textBaseline = 'middle';
      const x = circulo ? 100 : 6;
      const w = Math.min(640 - x - 6, g.measureText(texto).width + 48);
      g.fillStyle = '#fff';
      g.strokeStyle = tinta;
      g.lineWidth = 6;
      g.beginPath();
      g.roundRect(x, 20, w, 88, 44);
      g.fill();
      g.stroke();
      g.fillStyle = tinta;
      g.fillText(texto, x + 24, 66);
      if (!circulo) return;
      g.fillStyle = circulo.color;
      g.beginPath();
      g.arc(64, 64, 52, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.fillText(circulo.texto, 64, 66);
    });
    c.sprite.center.set(circulo ? 64 / 640 : 0, 0.5); // el círculo (o el borde) marca el punto exacto
    return c.sprite;
  }
  function aVector(p: { lat: number; lng: number }, r: number) {
    const phi = ((90 - p.lat) * Math.PI) / 180;
    const theta = ((p.lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  }
  /** Gira una esfera para que el punto (lat, lng) quede de frente a la persona. */
  function mirarA(obj: any, c: any) {
    obj.rotation.set(Math.atan2(c.y, Math.hypot(c.x, c.z)), -Math.atan2(c.x, c.z), 0);
  }
  /** Tierra como la del globo web: textura nocturna con relieve y halo azul de atmósfera. */
  function tierra(R: number) {
    const textura = texturas.load(url('atlas3d/earth-night.jpg'));
    textura.colorSpace = THREE.SRGBColorSpace;
    const grupo = new THREE.Group();
    grupo.add(new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 48),
      new THREE.MeshPhongMaterial({ map: textura, bumpMap: texturas.load(url('atlas3d/earth-topology.png')), bumpScale: 3, emissive: 0x112244, emissiveIntensity: 0.6, emissiveMap: textura }),
    ));
    grupo.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.06, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
    ));
    return grupo;
  }

  /** Ficha de la especie, como la tarjeta de la web (insignia de categoría, nombre, datos). */
  const INSIGNIA = { fauna: '#b45309', flora: '#15803d', mineral: '#7c3aed' };
  function dibujarFicha(g: CanvasRenderingContext2D, e: ElementoAtlas) {
    caja(g, 768, 640, '#fff');
    g.fillStyle = INSIGNIA[e.categoria];
    g.beginPath();
    g.roundRect(40, 36, 220, 64, 32);
    g.fill();
    g.fillStyle = '#fff';
    g.font = 'bold 36px sans-serif';
    g.textAlign = 'center';
    g.fillText(NOMBRE_CATEGORIA[e.categoria], 150, 80);
    g.textAlign = 'left';
    g.fillStyle = tinta;
    g.font = 'bold 60px sans-serif';
    g.fillText(e.nombre, 40, 170);
    g.font = 'italic 34px sans-serif';
    g.fillText(e.nombreCientifico, 40, 220);
    g.font = '32px sans-serif';
    let y = parrafo(g, `📍 ${e.region}`, 40, 285, 690, 42);
    y = parrafo(g, `⚠ ${e.estatus}`, 40, y, 690, 42);
    parrafo(g, e.descripcion, 40, y + 16, 690, 42);
  }

  // ---------- Botones: barra abajo, frente a ti ----------
  type Boton = { texto: string; malla: any; pintar: (activo: boolean) => void; accion: () => unknown };
  function crearBoton(texto: string, accion: Boton['accion'], rojo = false): Boton {
    const lienzo = document.createElement('canvas');
    lienzo.width = 384;
    lienzo.height = 128;
    const g = lienzo.getContext('2d')!;
    const textura = new THREE.CanvasTexture(lienzo);
    textura.colorSpace = THREE.SRGBColorSpace;
    const pintar = (activo: boolean) => {
      g.clearRect(0, 0, 384, 128);
      caja(g, 384, 128, rojo ? '#dc2626' : activo ? '#f59e0b' : '#fff');
      g.fillStyle = rojo || activo ? '#fff' : tinta;
      g.font = 'bold 50px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(texto, 192, 68);
      textura.needsUpdate = true;
    };
    pintar(false);
    const malla = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.07), new THREE.MeshBasicMaterial({ map: textura, transparent: true }));
    return { texto, malla, pintar, accion };
  }
  function barra(botones: Boton[]) {
    const grupo = new THREE.Group();
    botones.forEach((b, i) => {
      b.malla.position.x = (i - (botones.length - 1) / 2) * 0.23;
      grupo.add(b.malla);
    });
    grupo.position.set(0, 0.9, -0.8);
    grupo.rotation.x = -0.5; // inclinada hacia quien mira hacia abajo
    return grupo;
  }
  const salir = () => crearBoton('✕ Salir', () => void sesion.end(), true);

  // ---------- Modos: cada uno pone su raíz en la escena y dice qué se puede pulsar y qué se gira ----------
  type Clicable = { obj: any; accion: () => unknown };
  type Modo = { raiz: any; botones: Boton[]; clicables: () => Clicable[]; girable: () => any; tick: () => void; cerrar: () => void };
  let modo: Modo | null = null;
  let autoGiro = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cargando = false;
  function activar(nuevo: Modo) {
    if (modo) {
      escena.remove(modo.raiz);
      modo.cerrar();
    }
    modo = nuevo;
    escena.add(nuevo.raiz);
    autoGiro = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** El planeta con los pines del catálogo, sobre fondo de espacio. */
  function modoPlaneta(): Modo {
    const raiz = new THREE.Group();
    const R = 1.2;
    const giro = new THREE.Group(); // el exterior es el que se gira al arrastrar
    const esfera = new THREE.Group();
    esfera.add(tierra(R));
    // Pines como los de la web: punto del color de su categoría con borde blanco y brillo; el nombre solo al apuntarle.
    const pines = catalogo.map((e) => {
      const color = COLOR_CATEGORIA[e.categoria];
      const pin = cartel(128, 128, 0.07, (g) => {
        const brillo = g.createRadialGradient(64, 64, 20, 64, 64, 64);
        brillo.addColorStop(0, color);
        brillo.addColorStop(1, 'transparent');
        g.fillStyle = brillo;
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = color;
        g.strokeStyle = '#fff';
        g.lineWidth = 8;
        g.beginPath();
        g.arc(64, 64, 30, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }).sprite;
      pin.position.copy(aVector(e, R + 0.01));
      esfera.add(pin);
      const nombre = pildora(e.nombre);
      nombre.scale.multiplyScalar(0.55);
      nombre.center.set(0.5, -0.4); // encima del pin, centrada
      nombre.position.copy(pin.position);
      nombre.visible = false;
      esfera.add(nombre);
      return { e, pin, nombre };
    });
    if (inicial) mirarA(esfera, aVector(inicial, 1));
    giro.add(esfera);
    giro.position.copy(VISTA);
    raiz.add(giro);

    // Al pulsar un pin se abre su ficha a la derecha, con "Explorar en 3D" (como en la web).
    const ficha = cartel(768, 640, 1.1, () => {});
    ficha.sprite.position.set(VISTA.x + R + 0.9, 1.6, VISTA.z + 0.6);
    ficha.sprite.visible = false;
    raiz.add(ficha.sprite);
    let elegido: ElementoAtlas | null = null;
    const explorar = crearBoton('Explorar en 3D', () => elegido && irAEspecie(elegido));
    explorar.pintar(true);
    explorar.malla.scale.setScalar(1.8);
    explorar.malla.position.set(ficha.sprite.position.x, 1.6 - 0.55 - 0.1, ficha.sprite.position.z);
    explorar.malla.visible = false;
    raiz.add(explorar.malla);
    function abrirFicha(e: ElementoAtlas) {
      elegido = elegido === e ? null : e;
      ficha.sprite.visible = explorar.malla.visible = !!elegido;
      if (elegido) ficha.pintar((g) => dibujarFicha(g, e));
    }

    // Encabezado como el de la web.
    const titulo = cartel(1024, 200, 1.3, (g) => {
      caja(g, 1024, 200, '#fff');
      g.fillStyle = tinta;
      g.font = 'bold 64px sans-serif';
      g.fillText('Atlas Vivo 3D', 48, 90);
      g.font = '40px sans-serif';
      g.fillText('Gira el planeta y toca un pin para explorar.', 48, 155);
    });
    titulo.sprite.position.set(VISTA.x - R - 0.9, 1.6 + 0.6, VISTA.z + 0.6);
    raiz.add(titulo.sprite);

    escena.background = new THREE.Color(0x05070f);
    // Cielo estrellado como el del Atlas web (si carga).
    texturas.loadAsync(url('atlas3d/night-sky.webp')).then((cielo: any) => {
      cielo.colorSpace = THREE.SRGBColorSpace;
      cielo.mapping = THREE.EquirectangularReflectionMapping;
      if (modo?.raiz === raiz) escena.background = cielo;
    }).catch(() => {});
    const botones = [salir()];
    raiz.add(barra(botones));
    const sobre = new THREE.Raycaster();
    return {
      raiz,
      botones,
      clicables: () => [
        ...pines.map((p) => ({ obj: p.pin, accion: () => abrirFicha(p.e) })),
        ...(explorar.malla.visible ? [{ obj: explorar.malla, accion: explorar.accion }] : []),
      ],
      girable: () => giro,
      tick: () => {
        // Nombre visible solo en el pin al que apunta algún control.
        const apuntados = new Set<any>();
        for (const c of controles) {
          sobre.setFromXRController(c);
          sobre.camera = rayo.camera;
          const golpe = sobre.intersectObjects([esfera.children[0], ...pines.map((p) => p.pin)], true)[0];
          apuntados.add(golpe?.object);
        }
        for (const p of pines) p.nombre.visible = apuntados.has(p.pin) || p.e === elegido;
      },
      cerrar: () => {},
    };
  }

  /** Una especie, como el visor web, rodeada de su hábitat. */
  async function modoEspecie(e: ElementoAtlas): Promise<Modo> {
    const raiz = new THREE.Group();
    const [gltf, fondo] = await Promise.all([
      loader.loadAsync(url(e.modelo)),
      e.habitat ? texturas.loadAsync(url(e.habitat)).catch(() => null) : Promise.resolve(null),
    ]);
    // Hábitat como fondo 360°. shortcut: la foto es plana y se estira; con panoramas 360 reales se vería perfecto.
    if (fondo) {
      fondo.colorSpace = THREE.SRGBColorSpace;
      fondo.mapping = THREE.EquirectangularReflectionMapping;
    }
    const audio = e.sonido ? new Audio(url(e.sonido)) : null;
    if (audio) audio.loop = true;

    // Modelo: flota frente a ti; en "Tamaño" pasa a escala real sobre el suelo.
    const modelo = gltf.scene;
    const contenedor = new THREE.Group(); // se escala; el modelo conserva sus coordenadas (las de los puntos)
    contenedor.add(modelo);
    const caja0 = new THREE.Box3().setFromObject(modelo);
    const tam0 = caja0.getSize(new THREE.Vector3());
    const centro0 = caja0.getCenter(new THREE.Vector3());
    const pivote = new THREE.Group(); // gira sobre el centro del modelo
    pivote.add(contenedor);
    raiz.add(pivote);
    let radioReal = 1;
    function colocar(real: boolean) {
      const f = real
        ? (e.tamano?.metros ?? 1) / (e.tamano?.medida === 'alto' ? tam0.y : Math.max(tam0.x, tam0.y, tam0.z))
        : 2.6 / Math.max(tam0.x, tam0.y, tam0.z); // llena la vista como en la web
      contenedor.scale.setScalar(f);
      contenedor.position.set(-centro0.x * f, (real ? -caja0.min.y : -centro0.y) * f, -centro0.z * f);
      radioReal = (Math.max(tam0.x, tam0.z) * f) / 2;
      if (real) pivote.position.set(0, 0, -(radioReal + 1.5));
      else pivote.position.copy(VISTA);
    }
    colocar(false);

    // Puntos numerados: siguen al modelo al girar; con el gatillo abren su explicación.
    const vec = (s: string) => new THREE.Vector3(...s.split(' ').map((n) => parseFloat(n)));
    const puntos = e.puntos.map((p, i) => {
      const sprite = pildora(p.etiqueta, { color: verde, texto: String(i + 1) });
      raiz.add(sprite);
      return { sprite, posicion: vec(p.posicion), normal: vec(p.normal).normalize(), punto: p, numero: i + 1 };
    });
    const tarjeta = cartel(768, 420, 0.95, () => {});
    tarjeta.sprite.visible = false;
    raiz.add(tarjeta.sprite);
    let abierto = -1;
    function abrirPunto(i: number) {
      abierto = abierto === i ? -1 : i;
      tarjeta.sprite.visible = abierto >= 0;
      if (abierto < 0) return;
      const { punto, numero } = puntos[i];
      tarjeta.pintar((g) => {
        caja(g, 768, 420, '#fff');
        g.fillStyle = verde;
        g.font = 'bold 48px sans-serif';
        g.fillText(`${numero}. ${punto.etiqueta}`, 40, 80);
        g.fillStyle = tinta;
        g.font = '36px sans-serif';
        parrafo(g, punto.texto, 40, 150, 690, 48);
      });
    }

    // Ficha de datos (la tarjeta de la web).
    const ficha = cartel(768, 640, 1.1, (g) => dibujarFicha(g, e));
    ficha.sprite.visible = false;
    raiz.add(ficha.sprite);

    // Tamaño: maniquí de 1.70 m junto a la especie a escala real (se carga la primera vez).
    let maniqui: any;
    let enTamano = false;
    async function alternarTamano() {
      if (!maniqui) {
        maniqui = (await loader.loadAsync(url('atlas3d/models/maniqui.glb'))).scene;
        maniqui.scale.multiplyScalar(1.7 / new THREE.Box3().setFromObject(maniqui).getSize(new THREE.Vector3()).y);
        raiz.add(maniqui);
      }
      if (globo?.visible) alternarMigracion();
      enTamano = !enTamano;
      colocar(enTamano);
      if (enTamano) {
        const cm = new THREE.Box3().setFromObject(maniqui);
        maniqui.position.set(-radioReal - 0.5 - (cm.max.x - cm.min.x) / 2, maniqui.position.y - cm.min.y, pivote.position.z);
      }
      maniqui.visible = enTamano;
      pintarActivos();
    }

    // Migración: el globo toma el lugar del modelo, con la ruta mirando hacia ti.
    let globo: any;
    function alternarMigracion() {
      if (!globo) {
        const R = 0.7;
        const esfera = new THREE.Group();
        esfera.add(tierra(R));
        const ruta = e.migracion!;
        const naranja = 0xf59e0b;
        for (const p of ruta) {
          const punto = new THREE.Mesh(new THREE.SphereGeometry(0.015), new THREE.MeshBasicMaterial({ color: naranja }));
          punto.position.copy(aVector(p, R));
          esfera.add(punto);
        }
        const arco: any[] = []; // interpola entre puntos y los levanta en medio
        for (let i = 1; i < ruta.length; i++) {
          const a = aVector(ruta[i - 1], 1);
          const b = aVector(ruta[i], 1);
          for (let k = 0; k <= 24; k++) {
            const t = k / 24;
            arco.push(a.clone().lerp(b, t).normalize().multiplyScalar(R * (1.005 + 0.15 * Math.sin(Math.PI * t) * a.distanceTo(b))));
          }
        }
        esfera.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arco), new THREE.LineBasicMaterial({ color: naranja })));
        mirarA(esfera, ruta.reduce((s, p) => s.add(aVector(p, 1)), new THREE.Vector3()).normalize());
        globo = new THREE.Group();
        globo.add(esfera);
        globo.position.copy(VISTA);
        globo.visible = false;
        raiz.add(globo);
      }
      if (!globo.visible && enTamano) void alternarTamano();
      globo.visible = !globo.visible;
      pivote.visible = !globo.visible;
      pintarActivos();
    }

    const botones: Boton[] = [crearBoton('← Globo', () => irAPlaneta(e))];
    const bSonido = audio
      ? crearBoton('Sonido', () => {
          if (audio.paused) void audio.play().catch(() => {});
          else audio.pause();
          pintarActivos();
        })
      : null;
    const bMigracion = e.migracion?.length ? crearBoton('Migración', alternarMigracion) : null;
    const bTamano = e.tamano ? crearBoton('Tamaño', alternarTamano) : null;
    const bFicha = crearBoton('Ficha', () => {
      ficha.sprite.visible = !ficha.sprite.visible;
      pintarActivos();
    });
    botones.push(...[bSonido, bMigracion, bTamano, bFicha].filter((b): b is Boton => !!b), salir());
    function pintarActivos() {
      bSonido?.pintar(!!audio && !audio.paused);
      bMigracion?.pintar(!!globo?.visible);
      bTamano?.pintar(enTamano);
      bFicha.pintar(ficha.sprite.visible);
    }
    raiz.add(barra(botones));
    escena.background = fondo ?? new THREE.Color(0x87a8c8);
    void audio?.play().then(pintarActivos).catch(() => {});

    const p = new THREE.Vector3();
    const n = new THREE.Vector3();
    return {
      raiz,
      botones,
      clicables: () => puntos.filter((pt) => pt.sprite.visible).map((pt, i) => ({ obj: pt.sprite, accion: () => abrirPunto(i) })),
      girable: () => (globo?.visible ? globo : pivote),
      tick: () => {
        // Los puntos siguen al modelo; se ocultan durante la migración.
        raiz.updateMatrixWorld();
        for (const pt of puntos) {
          pt.sprite.visible = pivote.visible;
          n.copy(pt.normal).transformDirection(modelo.matrixWorld);
          pt.sprite.position.copy(modelo.localToWorld(p.copy(pt.posicion))).addScaledVector(n, 0.04);
        }
        // Tarjeta y ficha a los lados de lo que se esté viendo.
        const o = (globo?.visible ? globo : pivote).position;
        const lado = globo?.visible ? 0.9 : enTamano ? radioReal + 0.6 : 1.2;
        tarjeta.sprite.position.set(o.x - lado - 0.4, 1.5, o.z + 0.3);
        tarjeta.sprite.visible &&= pivote.visible;
        ficha.sprite.position.set(o.x + lado + 0.5, 1.5, o.z + 0.3);
      },
      cerrar: () => audio?.pause(),
    };
  }

  async function irAEspecie(e: ElementoAtlas) {
    if (cargando) return;
    cargando = true;
    try {
      activar(await modoEspecie(e));
    } finally {
      cargando = false;
    }
  }
  function irAPlaneta(desde?: ElementoAtlas) {
    inicial = desde;
    activar(modoPlaneta());
  }

  // ---------- Controles: gatillo sobre algo pulsable = pulsarlo; en otro lado y mover = girar ----------
  const controles: any[] = [];
  const rayo = new THREE.Raycaster();
  rayo.camera = render.xr.getCamera();
  const dir = new THREE.Vector3();
  const angulo = (c: any) => {
    dir.set(0, 0, -1).applyQuaternion(c.quaternion);
    return Math.atan2(dir.x, -dir.z);
  };
  let arrastre: { control: any; a0: number; r0: number } | null = null;
  for (const i of [0, 1]) {
    const control = render.xr.getController(i);
    controles.push(control);
    control.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -5)]),
      new THREE.LineBasicMaterial({ color: 0xffffff }),
    ));
    control.addEventListener('selectstart', () => {
      if (!modo) return;
      rayo.setFromXRController(control);
      const pulsables: Clicable[] = [...modo.botones.map((b) => ({ obj: b.malla, accion: b.accion })), ...modo.clicables()];
      const golpe = rayo.intersectObjects(pulsables.map((c) => c.obj))[0];
      const elegido = pulsables.find((c) => c.obj === golpe?.object);
      if (elegido) return void elegido.accion();
      autoGiro = false; // como en la web: al girarlo tú, deja de girar solo
      arrastre = { control, a0: angulo(control), r0: modo.girable().rotation.y };
    });
    control.addEventListener('selectend', () => {
      if (arrastre?.control === control) arrastre = null;
    });
    control.addEventListener('squeeze', () => void sesion.end());
    escena.add(control);
  }

  if (inicial) await irAEspecie(inicial);
  else irAPlaneta();
  await render.xr.setSession(sesion);

  render.setAnimationLoop(() => {
    if (modo) {
      const g = modo.girable();
      if (arrastre) g.rotation.y = arrastre.r0 + (angulo(arrastre.control) - arrastre.a0) * 3;
      else if (autoGiro) g.rotation.y += 0.002;
      modo.tick();
    }
    render.render(escena, camara);
  });

  sesion.addEventListener('end', () => {
    render.setAnimationLoop(null);
    modo?.cerrar();
    render.dispose();
  });
}
