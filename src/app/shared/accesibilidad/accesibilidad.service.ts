import { Injectable, signal } from '@angular/core';

export interface AccesibilidadConfig {
  grisesActivo: boolean;
  invertirActivo: boolean;
  lineaActiva: boolean;
  vozActiva: boolean;
  /** Tamaño de fuente base en px. */
  fontSize: number;
}

const STORAGE_KEY = 'visionlab.accesibilidad';
const FUENTE = { min: 12, base: 16, max: 24 };

const DEFAULT: AccesibilidadConfig = {
  grisesActivo: false,
  invertirActivo: false,
  lineaActiva: false,
  vozActiva: false,
  fontSize: FUENTE.base,
};

/**
 * Preferencias de accesibilidad: se guardan por dispositivo (localStorage) y se aplican
 * sobre <html>. Siempre se reemplaza el objeto completo para que los signals notifiquen.
 */
@Injectable({ providedIn: 'root' })
export class AccesibilidadService {
  readonly config = signal<AccesibilidadConfig>(this.leer());

  private ultimoTextoLeido = '';
  private timeoutVoz?: ReturnType<typeof setTimeout>;

  constructor() {
    this.aplicar();
  }

  toggle(clave: 'grisesActivo' | 'invertirActivo' | 'lineaActiva'): void {
    this.update({ [clave]: !this.config()[clave] });
  }

  toggleVoz(): void {
    const activa = !this.config().vozActiva;
    this.update({ vozActiva: activa });
    this.ultimoTextoLeido = '';

    if (!('speechSynthesis' in window)) return;
    if (activa) this.leerTexto('Modo voz activado');
    else window.speechSynthesis.cancel();
  }

  cambiarFuente(delta: number): void {
    const size = Math.min(FUENTE.max, Math.max(FUENTE.min, this.config().fontSize + delta));
    this.update({ fontSize: size });
  }

  resetFuente(): void {
    this.update({ fontSize: FUENTE.base });
  }

  restablecerTodo(): void {
    this.config.set(DEFAULT);
    this.guardar();
    this.aplicar();
    window.speechSynthesis?.cancel();
  }

  get limitesFuente() {
    return FUENTE;
  }

  /** Lee en voz alta el texto bajo el puntero (con una pausa para no saturar). */
  manejarMouseMove(x: number, y: number): void {
    if (!this.config().vozActiva) return;
    clearTimeout(this.timeoutVoz);
    this.timeoutVoz = setTimeout(() => {
      const texto = this.textoEn(x, y);
      if (texto) this.leerTexto(texto);
    }, 300);
  }

  private update(parcial: Partial<AccesibilidadConfig>): void {
    this.config.update((c) => ({ ...c, ...parcial }));
    this.guardar();
    this.aplicar();
  }

  private aplicar(): void {
    if (typeof document === 'undefined') return;
    const c = this.config();
    const html = document.documentElement;
    html.classList.toggle('grayscale-mode', c.grisesActivo);
    html.classList.toggle('invert-mode', c.invertirActivo);
    html.style.fontSize = c.fontSize === FUENTE.base ? '' : `${c.fontSize}px`;
  }

  private guardar(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config()));
    } catch {
      // Sin almacenamiento: las preferencias duran solo esta sesión.
    }
  }

  private leer(): AccesibilidadConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  }

  private textoEn(x: number, y: number): string {
    let el = document.elementFromPoint(x, y) as HTMLElement | null;
    while (el && el !== document.body) {
      const texto = (
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        (el instanceof HTMLImageElement ? el.alt : '') ||
        (el instanceof HTMLInputElement ? el.placeholder || el.value : '') ||
        el.innerText ||
        ''
      )
        .replace(/\s+/g, ' ')
        .trim();
      if (texto) return texto.length > 300 ? `${texto.slice(0, 300)}…` : texto;
      el = el.parentElement;
    }
    return '';
  }

  private leerTexto(texto: string): void {
    if (!this.config().vozActiva || texto === this.ultimoTextoLeido || !('speechSynthesis' in window)) return;
    this.ultimoTextoLeido = texto;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-MX';
    const voz = window.speechSynthesis.getVoices().find((v) => /^es[-_]MX/i.test(v.lang));
    if (voz) u.voice = voz;
    window.speechSynthesis.speak(u);
  }
}
