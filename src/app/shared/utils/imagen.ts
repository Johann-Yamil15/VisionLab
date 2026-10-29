/** Devuelve un src válido para <img> a partir de base64 con o sin prefijo data:. */
export function imagenSrc(base64: string | null | undefined): string | null {
  if (!base64) return null;
  return base64.startsWith('data:image') ? base64 : `data:image/jpeg;base64,${base64}`;
}

/** Clave para detectar la misma especie aunque cambien mayúsculas o acentos. */
export function claveEspecie(nombreCientifico: string, nombreComun: string): string {
  return (nombreCientifico || nombreComun || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
