import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Importado para comprobar el entorno
import { BehaviorSubject } from 'rxjs';

export interface AccesibilidadConfig {
  abierto: boolean;
  grisesActivo: boolean;
  invertirActivo: boolean;
  lineaActiva: boolean;
  vozActiva: boolean;
  fontSize: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccesibilidadService {
  private readonly STORAGE_KEY = 'accesibilidadConfig';
  private readonly FONT_SIZE_KEY = 'fontSizePreference';

  private isBrowser: boolean; // Estado del entorno

  private configSubject = new BehaviorSubject<AccesibilidadConfig>({
    abierto: false,
    grisesActivo: false,
    invertirActivo: false,
    lineaActiva: false,
    vozActiva: false,
    fontSize: '16px'
  });

  public config$ = this.configSubject.asObservable();

  private ultimoTextoLeido = '';
  private timeoutVoz: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { // Inyección de PLATFORM_ID
    this.isBrowser = isPlatformBrowser(platformId); // Determinación del entorno
    this.cargarConfiguracion();
  }

  private cargarConfiguracion(): void {
    if (!this.isBrowser) return; // 🛑 Salir si no estamos en el navegador

    const savedConfig = localStorage.getItem(this.STORAGE_KEY);
    const savedSize = localStorage.getItem(this.FONT_SIZE_KEY);

    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      if (savedSize) {
        config.fontSize = savedSize;
      }
      this.configSubject.next(config);
    } else if (savedSize) {
      const currentConfig = this.configSubject.value;
      currentConfig.fontSize = savedSize;
      this.configSubject.next(currentConfig);
    }
  }

  private guardarConfiguracion(): void {
    if (!this.isBrowser) return; // 🛑 Salir si no estamos en el navegador

    const config = this.configSubject.value;
    const { fontSize, ...configSinFontSize } = config;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configSinFontSize));
    localStorage.setItem(this.FONT_SIZE_KEY, fontSize);
  }

  toggleMenu(): void {
    const config = this.configSubject.value;
    config.abierto = !config.abierto;
    this.configSubject.next(config);
    this.guardarConfiguracion();
  }

  toggleEscalaGrises(): void {
    const config = this.configSubject.value;
    config.grisesActivo = !config.grisesActivo;
    this.configSubject.next(config);
    this.guardarConfiguracion();
  }

  toggleInvertirColores(): void {
    const config = this.configSubject.value;
    config.invertirActivo = !config.invertirActivo;
    this.configSubject.next(config);
    this.guardarConfiguracion();
  }

  toggleLineaLectura(): void {
    const config = this.configSubject.value;
    config.lineaActiva = !config.lineaActiva;
    this.configSubject.next(config);
    this.guardarConfiguracion();
  }

  toggleVoz(): void {
    const config = this.configSubject.value;
    config.vozActiva = !config.vozActiva;
    this.configSubject.next(config);
    this.guardarConfiguracion();
    this.ultimoTextoLeido = '';

    if (!this.isBrowser) return; // 🛑 Evitar window.speechSynthesis en SSR

    if (!config.vozActiva) {
      window.speechSynthesis.cancel();
    } else {
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.leerTexto('Modo voz activado');
        };
      } else {
        this.leerTexto('Modo voz activado');
      }
    }
  }

  aumentarFuente(): void {
    const config = this.configSubject.value;
    const currentSize = parseFloat(config.fontSize);
    config.fontSize = (currentSize + 1) + 'px';
    this.configSubject.next(config);
    this.guardarConfiguracion();
  }

  disminuirFuente(): void {
    const config = this.configSubject.value;
    const currentSize = parseFloat(config.fontSize);
    config.fontSize = Math.max(12, currentSize - 1) + 'px';
    this.configSubject.next(config);
    this.guardarConfiguracion();
  }

  resetFuente(): void {
    const config = this.configSubject.value;
    config.fontSize = '16px';
    this.configSubject.next(config);
    this.guardarConfiguracion();
  }

  manejarMouseMove(x: number, y: number): void {
    const config = this.configSubject.value;
    if (!config.vozActiva || !this.isBrowser) return; // 🛑 Evitar timeout en SSR

    clearTimeout(this.timeoutVoz);
    this.timeoutVoz = setTimeout(() => {
      const texto = this.obtenerTextoBajoCursor(x, y);
      if (texto) {
        this.leerTexto(texto);
      }
    }, 300);
  }

  private esVisible(el: HTMLElement): boolean {
    if (!this.isBrowser) return false; // 🛑 Evitar window.getComputedStyle en SSR
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || parseFloat(style.opacity) === 0) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width !== 0 && rect.height !== 0;
  }

  private obtenerTextoBajoCursor(x: number, y: number): string {
    if (!this.isBrowser) return ''; // 🛑 Evitar document.elementFromPoint en SSR
    const elemento = document.elementFromPoint(x, y);
    if (!elemento) return '';

    let el: HTMLElement | null = elemento as HTMLElement;
    const maxChars = 300;

    while (el && el !== document.documentElement) {
      if (el.nodeType === Node.ELEMENT_NODE && this.esVisible(el)) {
        let texto = '';

        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) {
          texto = ariaLabel.trim();
        }

        if (!texto) {
          const title = el.getAttribute('title');
          if (title && title.trim()) {
            texto = title.trim();
          }
        }

        if (!texto) {
          if (el instanceof HTMLImageElement) {
            texto = el.alt.trim();
          } else if (el instanceof HTMLInputElement) {
            texto = (el.placeholder || el.value || '').trim();
          } else if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) {
            texto = el.textContent?.trim() || '';
          } else {
            let raw = el.textContent || '';
            raw = raw.replace(/(\s{2,})/g, ' ').replace(/\s([.!?])/g, '$1').trim();
            texto = raw;
          }
        }

        if (texto) {
          if (texto.length > maxChars) {
            texto = texto.slice(0, maxChars) + '...';
          }
          return texto;
        }
      }
      el = el.parentElement;
    }
    return '';
  }

  private leerTexto(texto: string): void {
    const config = this.configSubject.value;
    if (!texto || !config.vozActiva || !this.isBrowser) return; // 🛑 Evitar window.speechSynthesis en SSR
    if (texto === this.ultimoTextoLeido) return;

    this.ultimoTextoLeido = texto;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-MX';

    const voces = window.speechSynthesis.getVoices();
    const vozEs = voces.find(v => /^es(-|_)MX\b/.test(v.lang) && /female|mujer|Woman|Female/i.test(v.name));
    if (vozEs) utterance.voice = vozEs;

    window.speechSynthesis.speak(utterance);
  }

  getConfig(): AccesibilidadConfig {
    return this.configSubject.value;
  }
}