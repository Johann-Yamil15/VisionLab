#!/usr/bin/env node
/**
 * Agrega un elemento nuevo al Atlas Vivo 3D: optimiza el modelo, copia los archivos y añade la entrada
 * a public/atlas3d/atlas.json (sin reescribir el resto del archivo, para que el diff sea solo la entrada nueva).
 *
 *   node scripts/atlas-agregar.mjs --id cuarzo-rosa --nombre "Cuarzo rosa" --categoria mineral \
 *     --modelo C:\modelos\rosa.glb --credito-modelo "Modelo: \"x\" por Y · Sketchfab (url) · CC BY 4.0" \
 *     --lat 19.4 --lng -99.1 --region "México" --descripcion "Un cuarzo de color rosa." \
 *     --alias "cuarzo rosado,rose quartz" --dry-run
 *
 * Ver docs/atlas3d-pendientes.md → "Cómo agregar un elemento".
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';

const MAX_MODELO = 1.5 * 1024 * 1024;
const MAX_SONIDO = 100 * 1024;
const MAX_FONDO = 350 * 1024;
const CATEGORIAS = ['fauna', 'flora', 'mineral'];
const BANDERAS = new Set(['sin-optimizar', 'metalrough', 'dry-run', 'forzar', 'ayuda']);

const ayuda = `Uso: node scripts/atlas-agregar.mjs --id <slug> --nombre <texto> --categoria <fauna|flora|mineral>
       --modelo <archivo.glb> --credito-modelo <texto> --lat <n> --lng <n> --descripcion <texto> [opciones]

Opcionales: --cientifico, --alias "a,b,c", --region, --estatus, --foto <archivo>, --credito-foto,
            --sonido <archivo.mp3>, --credito-sonido, --habitat <archivo|nombre existente>, --credito-habitat,
            --raiz <carpeta public> (por defecto ./public)
Banderas:   --dry-run (no escribe nada), --sin-optimizar (el .glb ya viene optimizado con meshopt),
            --metalrough (convierte antes materiales spec-gloss), --forzar (ignora los límites de peso)`;

function leerArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) fallar(`Argumento inesperado: ${argv[i]}`);
    const clave = argv[i].slice(2);
    if (BANDERAS.has(clave)) out[clave] = true;
    else if (argv[i + 1] === undefined || argv[i + 1].startsWith('--')) fallar(`Falta el valor de --${clave}`);
    else out[clave] = argv[++i];
  }
  return out;
}

function fallar(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const a = leerArgs(process.argv.slice(2));
if (a.ayuda) {
  console.log(ayuda);
  process.exit(0);
}

// ---------- validaciones ----------
for (const k of ['id', 'nombre', 'categoria', 'modelo', 'credito-modelo', 'lat', 'lng', 'descripcion']) {
  if (!a[k]) fallar(`Falta --${k}\n\n${ayuda}`);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.id)) fallar('--id debe ser un slug en minúsculas, por ejemplo "cuarzo-rosa"');
if (!CATEGORIAS.includes(a.categoria)) fallar(`--categoria debe ser una de: ${CATEGORIAS.join(', ')}`);
const lat = Number(a.lat);
const lng = Number(a.lng);
if (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180)) fallar('--lat debe estar entre -90 y 90, y --lng entre -180 y 180');
if (!existsSync(a.modelo) || extname(a.modelo).toLowerCase() !== '.glb') fallar(`--modelo debe ser un archivo .glb existente: ${a.modelo}`);

const publica = resolve(a.raiz ?? 'public');
const atlasDir = join(publica, 'atlas3d');
const jsonPath = join(atlasDir, 'atlas.json');
if (!existsSync(jsonPath)) fallar(`No existe ${jsonPath} (usa --raiz si el proyecto no está en el directorio actual)`);

const crudo = readFileSync(jsonPath, 'utf8');
const catalogo = JSON.parse(crudo);
if (catalogo.some((e) => e.id === a.id)) fallar(`Ya existe un elemento con id "${a.id}" en atlas.json`);
const alias = (a.alias ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const avisos = [];
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const comprobarPeso = (ruta, max, etiqueta) => {
  const peso = statSync(ruta).size;
  if (peso > max) {
    const msg = `${etiqueta} pesa ${kb(peso)} (límite ${kb(max)})`;
    if (a.forzar) avisos.push(msg);
    else fallar(`${msg}. Usa un archivo más liviano o --forzar.`);
  }
  return peso;
};

// ---------- modelo ----------
const tmp = mkdtempSync(join(tmpdir(), 'atlas-'));
let modeloListo = a.modelo;
try {
  if (!a['sin-optimizar']) {
    // Una sola cadena de comando (con comillas) en vez de args + shell: evita el aviso DEP0190 de Node.
    const q = (x) => (/[\s"]/.test(x) ? `"${x.replace(/"/g, '\\"')}"` : x);
    const gt = (args) => spawnSync(`npx gltf-transform ${args.map(q).join(' ')}`, { stdio: 'inherit', shell: true });
    let origen = a.modelo;
    if (a.metalrough) {
      origen = join(tmp, 'metalrough.glb');
      if (gt(['metalrough', a.modelo, origen]).status !== 0) fallar('gltf-transform metalrough falló');
    }
    modeloListo = join(tmp, 'optimizado.glb');
    const r = gt([
      'optimize', origen, modeloListo,
      '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024',
      '--palette', 'false', '--join', 'false', '--instance', 'false', '--flatten', 'false', '--simplify', 'false',
    ]);
    if (r.status !== 0) {
      fallar(
        'No se pudo optimizar el modelo. ¿Está instalado @gltf-transform/cli? (npm i -D @gltf-transform/cli)\n' +
          '  Si el .glb ya viene optimizado con meshopt, usa --sin-optimizar.',
      );
    }
  }
  const pesoModelo = comprobarPeso(modeloListo, MAX_MODELO, 'El modelo');

  // ---------- archivos extra ----------
  const destinos = []; // [origen, destino relativo a atlas3d]
  const entrada = {
    id: a.id,
    nombre: a.nombre,
    nombreCientifico: a.cientifico ?? '',
    ...(alias.length ? { alias } : {}),
    categoria: a.categoria,
    lat,
    lng,
    region: a.region ?? '',
    estatus: a.estatus ?? 'Sin evaluar',
    descripcion: a.descripcion,
    miniatura: '',
    modelo: `atlas3d/models/${a.id}.glb`,
    sonido: '',
    habitat: '',
    credito: a['credito-foto'] ?? '',
    creditoModelo: a['credito-modelo'],
    creditoSonido: a['credito-sonido'] ?? '',
    creditoHabitat: a['credito-habitat'] ?? '',
    puntos: [],
  };
  destinos.push([modeloListo, entrada.modelo]);

  if (a.foto) {
    if (!existsSync(a.foto)) fallar(`No existe --foto: ${a.foto}`);
    entrada.miniatura = `atlas3d/fotos/${a.id}${extname(a.foto).toLowerCase()}`;
    destinos.push([a.foto, entrada.miniatura]);
  } else avisos.push('Sin --foto: la tarjeta del globo no tendrá miniatura.');

  if (a.sonido) {
    if (!existsSync(a.sonido)) fallar(`No existe --sonido: ${a.sonido}`);
    comprobarPeso(a.sonido, MAX_SONIDO, 'El sonido');
    entrada.sonido = `atlas3d/sonidos/${a.id}${extname(a.sonido).toLowerCase()}`;
    destinos.push([a.sonido, entrada.sonido]);
  } else avisos.push('Sin --sonido: la ficha mostrará "Sin sonido".');

  if (a.habitat) {
    const existente = join(atlasDir, 'habitats', a.habitat);
    if (existsSync(existente) && statSync(existente).isFile()) entrada.habitat = `atlas3d/habitats/${a.habitat}`;
    else if (existsSync(a.habitat)) {
      comprobarPeso(a.habitat, MAX_FONDO, 'El fondo');
      entrada.habitat = `atlas3d/habitats/${basename(a.habitat)}`;
      destinos.push([a.habitat, entrada.habitat]);
    } else fallar(`--habitat no es un archivo ni un fondo existente en habitats/: ${a.habitat}`);
  } else avisos.push('Sin --habitat: el visor usará su fondo por defecto.');

  if (!entrada.creditoModelo.trim()) fallar('--credito-modelo no puede estar vacío (las licencias CC BY exigen crédito)');
  avisos.push('puntos: [] — agrega los puntos 3D con el Editor de model-viewer (docs/atlas3d-pendientes.md).');

  // ---------- escribir ----------
  const crlf = crudo.includes('\r\n');
  const nl = crlf ? '\r\n' : '\n';
  const fin = crudo.lastIndexOf(']');
  if (fin < 0) fallar('atlas.json no parece un arreglo JSON');
  const bloque = JSON.stringify(entrada, null, 2)
    .split('\n')
    .map((l) => '  ' + l)
    .join(nl);
  const nuevo = `${crudo.slice(0, fin).trimEnd()},${nl}${bloque}${nl}${crudo.slice(fin)}`;
  JSON.parse(nuevo); // si quedó mal formado, falla antes de escribir

  console.log(`\n${a['dry-run'] ? '[dry-run] ' : ''}Elemento "${a.nombre}" (${a.id}) → ${a.categoria}`);
  console.log(`  modelo: ${kb(pesoModelo)}${alias.length ? `   alias: ${alias.join(', ')}` : ''}`);
  for (const [, destino] of destinos) console.log(`  + public/${destino}`);
  console.log('  + entrada en public/atlas3d/atlas.json');
  for (const v of avisos) console.log(`  ! ${v}`);

  if (a['dry-run']) {
    console.log('\nNo se escribió nada (--dry-run).');
  } else {
    for (const [origen, destino] of destinos) {
      const ruta = join(publica, destino);
      mkdirSync(join(ruta, '..'), { recursive: true });
      copyFileSync(origen, ruta);
    }
    writeFileSync(jsonPath, nuevo, 'utf8');
    console.log('\n✓ Listo. Revisa /atlas y /atlas/' + a.id + ' y luego haz commit.');
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
