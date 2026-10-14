import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // isPlatformBrowser no es estrictamente necesario aquí si el servicio ya lo maneja, pero es buena práctica en componentes
import { AccesibilidadService, AccesibilidadConfig } from './accesibilidad.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-accesibilidad',
  standalone: true,
  imports: [CommonModule],
  // Nota: El templateUrl y styleUrls deben apuntar a tus archivos .html y .css reales.
  templateUrl: './accesibilidad.component.html', 
  styleUrls: ['./accesibilidad.component.css']
})
export class AccesibilidadComponent implements OnInit, OnDestroy {
  // Inicialización directa de la configuración (se actualizará en ngOnInit)
  config: AccesibilidadConfig; 
  
  lineaY: number = 0;
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  constructor(
    private accesibilidadService: AccesibilidadService,
    @Inject(PLATFORM_ID) private platformId: Object // Inyectamos PLATFORM_ID para usar HostListener de forma segura
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Obtener la configuración inicial directamente del BehaviorSubject
    this.config = this.accesibilidadService.getConfig(); 
  }

  ngOnInit(): void {
    // 1. Suscribirse a los cambios de configuración
    this.accesibilidadService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        this.config = config;
        this.aplicarEstilos(); // Aplicar estilos con cada cambio de configuración
      });

    // 2. Aplicar estilos iniciales si ya se cargaron (aunque la suscripción lo hará)
    this.aplicarEstilos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja el movimiento del ratón para la línea de lectura y la voz
   * SOLO en el navegador.
   */
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isBrowser) return; // Evitar la ejecución en SSR

    if (this.config.lineaActiva) {
      this.lineaY = event.clientY;
    }
    
    // Delegar la lógica de lectura al servicio
    if (this.config.vozActiva) {
      this.accesibilidadService.manejarMouseMove(event.clientX, event.clientY);
    }
  }

  /**
   * Aplica las clases CSS y el tamaño de fuente al elemento HTML raíz.
   */
  private aplicarEstilos(): void {
    if (!this.isBrowser) return; // Evitar manipulación del DOM en SSR
    
    const html = document.documentElement;
    
    // Escala de grises
    html.classList.toggle('grayscale-mode', this.config.grisesActivo);

    // Inversión de colores
    html.classList.toggle('invert-mode', this.config.invertirActivo);

    // Tamaño de fuente (siempre aplicar)
    html.style.fontSize = this.config.fontSize;
    
    // Línea de lectura (no requiere manipulación del DOM aquí, se usa 'lineaY' en la plantilla)
  }

  // --- Métodos de Interfaz (Delegación al Servicio) ---
  
  toggleMenu(): void {
    this.accesibilidadService.toggleMenu();
  }

  toggleEscalaGrises(): void {
    this.accesibilidadService.toggleEscalaGrises();
  }

  toggleInvertirColores(): void {
    this.accesibilidadService.toggleInvertirColores();
  }

  toggleLineaLectura(): void {
    this.accesibilidadService.toggleLineaLectura();
  }

  toggleVoz(): void {
    this.accesibilidadService.toggleVoz();
  }

  aumentarFuente(): void {
    this.accesibilidadService.aumentarFuente();
  }

  disminuirFuente(): void {
    this.accesibilidadService.disminuirFuente();
  }

  resetFuente(): void {
    this.accesibilidadService.resetFuente();
  }
}