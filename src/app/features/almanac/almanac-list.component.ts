import { Component, OnInit } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HallazgosService, Hallazgo } from '../../Core/services/hallazgos.service';
import { Router } from '@angular/router';

// 💡 Interfaz necesaria para que ResultsComponent la reconozca
export interface AnalysisResult {
  tipo: string;
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  nivelConfianza: string; // Espera un string (e.g., "95")
}

@Component({
  selector: 'app-almanac-list',
  standalone: true,
  imports: [
    CommonModule,
    UpperCasePipe,
    MatProgressSpinnerModule
  ],
  templateUrl: './almanac-list.component.html',
  styleUrls: ['./almanac-list.component.scss']
})
export class AlmanacListComponent implements OnInit {
  hallazgos: Hallazgo[] = [];
  hallazgosFiltrados: Hallazgo[] = [];
  tipos: string[] = [];
  filtroActivo: string = 'todos';
  loading: boolean = true;

  // Control del carrusel
  currentIndex: number = 0;
  carouselTransform: string = '';

  // 🟢 PROPIEDADES PARA EL MODAL DE ELIMINACIÓN
  mostrarModalEliminar: boolean = false;
  hallazgoAEliminar: Hallazgo | null = null;

  constructor(
    private hallazgosService: HallazgosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarHallazgos();
  }

  // ============================================
  // 📦 MÉTODOS DE LÓGICA DE NEGOCIO
  // ============================================

  cargarHallazgos(): void {
    this.loading = true;
    this.hallazgosService.getAllHallazgos().subscribe({
      next: (data) => {
        console.log('📦 Hallazgos cargados:', data);
        this.hallazgos = data;
        this.hallazgosFiltrados = data;
        this.tipos = this.hallazgosService.getTiposUnicos(data);
        this.loading = false;
        this.updateCarousel();
      },
      error: (error) => {
        console.error('❌ Error cargando hallazgos:', error);
        this.loading = false;
      }
    });
  }

  filtrarPorTipo(tipo: string): void {
    this.filtroActivo = tipo;
    this.currentIndex = 0;

    if (tipo === 'todos') {
      this.hallazgosFiltrados = this.hallazgos;
    } else {
      this.hallazgosFiltrados = this.hallazgosService.filterByTipo(this.hallazgos, tipo);
    }

    this.updateCarousel();
    console.log(`🔍 Filtrado por: ${tipo} - ${this.hallazgosFiltrados.length} resultados`);
  }

  // ============================================
  // 🎠 MÉTODOS DEL CARRUSEL
  // ============================================

  siguiente(): void {
    if (this.currentIndex < this.hallazgosFiltrados.length - 1) {
      this.currentIndex++;
      this.updateCarousel();
    }
  }

  anterior(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
    }
  }

  irA(index: number): void {
    this.currentIndex = index;
    this.updateCarousel();
  }

  updateCarousel(): void {
    const offset = -this.currentIndex * 100;
    this.carouselTransform = `translateX(${offset}%)`;
  }

  // ============================================
  // 🚀 NAVEGACIÓN Y ACCIONES
  // ============================================

  /**
   * 🚀 Navega a la vista de análisis reutilizando ResultsComponent y ChatComponent.
   * Mapea el Hallazgo (DB) a AnalysisResult (UI) y usa Router State.
   */
  verDetalle(hallazgo: Hallazgo): void {
    console.log('👁️ Ver detalle:', hallazgo.nombreComun);
    console.log('📦 Hallazgo completo:', hallazgo);

    // 1. Mapeo al formato AnalysisResult que espera ResultsComponent
    const analysisResultData: AnalysisResult = {
      tipo: hallazgo.tipo,
      nombreComun: hallazgo.nombreComun,
      nombreCientifico: hallazgo.nombreCientifico,
      descripcion: hallazgo.descripcion,
      // ✅ Convertimos el número de nivelConfianza a string con validación
      nivelConfianza: (hallazgo.nivelConfianza ?? 0).toString(),
    };

    console.log('🔄 Datos mapeados:', analysisResultData);

    // 2. Obtener la imagen en formato correcto
    const photoData = this.getImageSrc(hallazgo);
    console.log('🖼️ Imagen procesada:', photoData.substring(0, 50) + '...');

    // 3. Navegación a AnalysisViewComponent (que contiene ResultsComponent + ChatComponent)
    this.router.navigate(['/analysis-view'], {
      state: {
        result: analysisResultData,
        photo: photoData,
        fromAlmanac: true // 🚩 Bandera crítica para que ResultsComponent NO guarde
      }
    });
  }

  // ============================================
  // 🗑️ LÓGICA DE ELIMINACIÓN CON MODAL
  // ============================================

  /**
   * 🟢 Muestra el modal de confirmación para eliminar un hallazgo.
   */
  eliminarHallazgo(id: string, event: Event): void {
    event.stopPropagation(); // Evitar que se active el click del card

    const hallazgo = this.hallazgos.find(h => h.id === id);

    if (hallazgo) {
      this.hallazgoAEliminar = hallazgo;
      this.mostrarModalEliminar = true;
      console.log('🗑️ Modal de eliminación activado para:', hallazgo.nombreComun);
    }
  }

  /**
   * 🟢 Cancela la eliminación y cierra el modal.
   */
  cancelarEliminacion(): void {
    this.mostrarModalEliminar = false;
    this.hallazgoAEliminar = null;
    console.log('🛑 Eliminación cancelada por el usuario.');
  }

  /**
   * 🟢 Confirma y ejecuta la eliminación del hallazgo.
   */
  confirmarEliminacion(): void {
    if (!this.hallazgoAEliminar || !this.hallazgoAEliminar.id) {
      console.error('❌ No se seleccionó un hallazgo válido para eliminar.');
      this.cancelarEliminacion();
      return;
    }

    const idAEliminar = this.hallazgoAEliminar.id;
    const nombreHallazgo = this.hallazgoAEliminar.nombreComun;

    console.log(`🗑️ Eliminando hallazgo: ${nombreHallazgo} (ID: ${idAEliminar})`);

    this.hallazgosService.deleteHallazgo(idAEliminar).subscribe({
      next: () => {
        console.log('✅ Hallazgo eliminado exitosamente:', nombreHallazgo);
        
        // Recargar la lista completa para actualizar la UI
        this.cargarHallazgos();
        
        // Cerrar el modal
        this.cancelarEliminacion();
      },
      error: (error) => {
        console.error('❌ Error eliminando hallazgo:', error);
        
        // Cerrar el modal incluso si hay error (puedes agregar un mensaje de error aquí)
        this.cancelarEliminacion();
        
        // TODO: Mostrar mensaje de error al usuario
        // this.showErrorToast('No se pudo eliminar el hallazgo');
      }
    });
  }

  // ============================================
  // 🛠️ MÉTODOS AUXILIARES
  // ============================================

  /**
   * Obtiene la imagen en formato Base64 correctamente formateado.
   */
  getImageSrc(hallazgo: Hallazgo): string {
    // Verificar si existe la propiedad imagenBase64
    if ('imagenBase64' in hallazgo && hallazgo.imagenBase64) {
      // Si ya tiene el prefijo data:image, retornarlo tal cual
      if (hallazgo.imagenBase64.startsWith('data:image')) {
        return hallazgo.imagenBase64;
      }
      // Si es base64 puro, agregar el prefijo
      return `data:image/jpeg;base64,${hallazgo.imagenBase64}`;
    }
    
    // Fallback a imagen placeholder
    console.warn('⚠️ No se encontró imagen para el hallazgo:', hallazgo.nombreComun);
    return 'assets/placeholder-image.png';
  }

  /**
   * Formatea la fecha en español (México).
   */
  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Obtiene el icono de Material Icons según el tipo.
   */
  getTipoIcon(tipo: string): string {
    const iconMap: { [key: string]: string } = {
      'Insecto': 'bug_report',
      'Planta': 'eco',
      'Hoja': 'park',
      'Roca': 'landscape',
      'Hongo': 'spa',
      'Rama': 'nature',
      'Objeto Artificial': 'build'
    };
    return iconMap[tipo] || 'category';
  }

  // ============================================
  // 🎨 TRANSFORMACIONES CSS DEL CARRUSEL 3D
  // ============================================

  /**
   * Calcula la transformación 3D para cada tarjeta del carrusel.
   */
  getCardTransform(index: number): string {
    const diff = index - this.currentIndex;
    const translateX = diff * 120;
    const translateZ = Math.abs(diff) * -200;
    const rotateY = diff * 15;

    return `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg)`;
  }

  /**
   * Calcula la opacidad de cada tarjeta según su distancia del centro.
   */
  getCardOpacity(index: number): number {
    const diff = Math.abs(index - this.currentIndex);
    if (diff === 0) return 1;
    if (diff === 1) return 0.6;
    return 0.3;
  }

  /**
   * Calcula el z-index para el apilamiento correcto de las tarjetas.
   */
  getCardZIndex(index: number): number {
    const diff = Math.abs(index - this.currentIndex);
    return 100 - diff;
  }
}