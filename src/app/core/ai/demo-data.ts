import { AnalysisResult } from '../../shared/models/hallazgo.model';

/**
 * Escaneos precargados del MODO DEMO (por si el CLI de Claude o la red fallan en el museo).
 * Son fichas completas: no se llama a ninguna IA. Los tres primeros coinciden con elementos del
 * Atlas (public/atlas3d/atlas.json) para poder mostrar "Ver en el Atlas 3D"; el último tiene
 * confianza baja para enseñar la elección entre 3 opciones.
 * Las categorías (`tipo`) deben ser de las 12 de shared/utils/tipos.ts.
 */
export const ANALISIS_DEMO: readonly AnalysisResult[] = [
  {
    tipo: 'Tierra y suelos',
    nombreComun: 'Jaguar',
    nombreCientifico: 'Panthera onca',
    descripcion:
      'El felino más grande de América. Tiene manchas en forma de rosetas y una mordida tan fuerte que puede romper el caparazón de una tortuga. Es un cazador sigiloso que nada muy bien.',
    nivelConfianza: 96,
    habitat: 'Selvas y humedales',
    alimentacion: 'Carnívoro',
    colores: 'Dorado con manchas negras',
    tamano: 'Grande',
    lema: '¡El rey silencioso de la selva!',
    amenazas: 'Pérdida de selva por la tala y la ganadería, y la caza ilegal.',
    impactoEcologico: 'Como gran depredador mantiene en equilibrio a las poblaciones de sus presas.',
    peligro: 'Alto',
    opciones: [],
  },
  {
    tipo: 'Plantas',
    nombreComun: 'Nenúfar gigante',
    nombreCientifico: 'Victoria amazonica',
    descripcion:
      'Sus hojas flotantes miden hasta 3 metros de ancho y aguantan el peso de un niño. Por debajo tienen espinas y venas gruesas que las hacen fuertes. Sus flores se abren de noche.',
    nivelConfianza: 93,
    habitat: 'Lagos del Amazonas',
    alimentacion: 'Luz del sol',
    colores: 'Verde, blanco y rosa',
    tamano: 'Grande',
    lema: '¡Una balsa natural con flores!',
    amenazas: 'Contaminación del agua y cambios en los ríos donde crece.',
    impactoEcologico: 'Da sombra y refugio a peces e insectos del lago.',
    peligro: 'Bajo',
    opciones: [],
  },
  {
    tipo: 'Rocas y minerales',
    nombreComun: 'Cuarzo amatista',
    nombreCientifico: '',
    descripcion:
      'Un cristal morado que se forma dentro de rocas huecas llamadas geodas. Su color viene de pequeñas cantidades de hierro. Los antiguos griegos creían que protegía de las borracheras.',
    nivelConfianza: 91,
    habitat: 'Geodas y cuevas',
    alimentacion: 'No aplica',
    colores: 'Morado y violeta',
    tamano: 'Pequeño',
    lema: '¡Un tesoro escondido bajo tierra!',
    amenazas: 'La minería puede dañar los lugares donde se forma.',
    impactoEcologico: 'No es un ser vivo; se forma durante miles de años dentro de las rocas.',
    peligro: 'Bajo',
    opciones: [],
  },
  {
    tipo: 'Insectos',
    nombreComun: 'Mariquita',
    nombreCientifico: 'Coccinellidae',
    descripcion:
      'Un escarabajo pequeño con el cuerpo redondo y puntitos negros. Sus colores brillantes avisan a los depredadores que sabe mal. Una sola puede comer cientos de pulgones en su vida.',
    nivelConfianza: 88,
    habitat: 'Jardines y cultivos',
    alimentacion: 'Pulgones',
    colores: 'Rojo y negro',
    tamano: 'Diminuto',
    lema: '¡La guardiana de las plantas!',
    amenazas: 'Pesticidas y la pérdida de jardines y flores silvestres.',
    impactoEcologico: 'Controla plagas de forma natural y ayuda a cuidar los cultivos.',
    peligro: 'Bajo',
    opciones: [],
  },
  {
    tipo: 'Hongos',
    nombreComun: 'Amanita muscaria',
    nombreCientifico: 'Amanita muscaria',
    descripcion:
      'El hongo de cuento: sombrero rojo con motitas blancas. Es venenoso, así que nunca se debe tocar sin guantes ni probar. Vive en simbiosis con las raíces de algunos árboles.',
    nivelConfianza: 90,
    habitat: 'Bosques de pinos',
    alimentacion: 'Materia orgánica',
    colores: 'Rojo y blanco',
    tamano: 'Pequeño',
    lema: '¡Bonito de ver, peligroso de comer!',
    amenazas: 'Cambios en los bosques donde vive.',
    impactoEcologico: 'Ayuda a los árboles a absorber agua y nutrientes del suelo.',
    peligro: 'Alto',
    opciones: [],
  },
  {
    tipo: 'Plantas',
    nombreComun: 'Hoja de roble',
    nombreCientifico: 'Quercus',
    descripcion:
      'Una hoja con el borde ondulado, típica de los robles. En otoño cambia de color y cae al suelo, donde se convierte en abono para el bosque.',
    nivelConfianza: 48,
    habitat: 'Bosques templados',
    alimentacion: 'Luz del sol',
    colores: 'Verde y café',
    tamano: 'Pequeño',
    lema: '¡Una hoja con muchas historias!',
    amenazas: 'Tala y enfermedades de los bosques.',
    impactoEcologico: 'Sus hojas alimentan el suelo y dan refugio a insectos.',
    peligro: 'Bajo',
    opciones: [
      { tipo: 'Plantas', nombreComun: 'Hoja de roble', nombreCientifico: 'Quercus' },
      { tipo: 'Plantas', nombreComun: 'Hoja de arce', nombreCientifico: 'Acer' },
      { tipo: 'Plantas', nombreComun: 'Hoja de encino', nombreCientifico: 'Quercus rugosa' },
    ],
  },
];
