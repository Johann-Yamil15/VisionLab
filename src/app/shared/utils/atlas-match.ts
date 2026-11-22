/** Lo mínimo que se necesita de un elemento del Atlas para compararlo (ver ElementoAtlas). */
export interface ElementoComparable {
  id: string;
  nombre: string;
  nombreCientifico: string;
}

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Una cadena "contiene" a la otra, ignorando nombres cortos (evita que "oso" coincida con todo). */
const seParecen = (a: string, b: string) => a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a));

/**
 * Busca el elemento del Atlas que corresponde a lo que identificó la IA: primero por nombre
 * científico exacto y, si no, por nombre común (sin acentos ni mayúsculas).
 * Devuelve undefined si no hay coincidencia (entonces no se muestra "Ver en el Atlas 3D").
 */
export function buscarEnAtlas<T extends ElementoComparable>(
  elementos: readonly T[],
  nombreComun: string | null | undefined,
  nombreCientifico: string | null | undefined,
): T | undefined {
  const cientifico = normalizar(nombreCientifico ?? '');
  if (cientifico) {
    const porCientifico = elementos.find((e) => normalizar(e.nombreCientifico) === cientifico);
    if (porCientifico) return porCientifico;
  }

  const comun = normalizar(nombreComun ?? '');
  if (!comun) return undefined;
  return elementos.find((e) => seParecen(normalizar(e.nombre), comun));
}
