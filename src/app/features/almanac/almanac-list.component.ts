import { Component, OnInit } from '@angular/core';
import { CommonModule, UpperCasePipe, DatePipe } from '@angular/common'; // Agregado DatePipe
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HallazgosService, Hallazgo } from '../../Core/services/hallazgos.service';
import { Router } from '@angular/router';

// 💡 Interfaz Hallazgo (debería venir de hallazgos.service, pero la definimos aquí para contexto)
// NOTA: Para este ejemplo, asumimos que Hallazgo tiene la estructura de la base de datos
// y NO usamos AnalysisResult para simplificar la navegación de detalle.
// Asume que Hallazgo tiene la estructura completa, incluyendo:
// id, tipo, nombreComun, nombreCientifico, descripcion, nivelConfianza, fechaCaptura, imagenBase64, ubicacion
// Si Hallazgo no tiene estos campos, debes añadirlos en tu servicio/modelo de Hallazgo.

@Component({
  selector: 'app-almanac-list',
  standalone: true,
  imports: [
    CommonModule,
    UpperCasePipe,
    MatProgressSpinnerModule,
    DatePipe // Importado para el uso en el HTML
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
    // La lógica de transformación se maneja con getCardTransform en el HTML
  }

  // ============================================
  // 🚀 NAVEGACIÓN A DETALLE (CORRECCIÓN)
  // ============================================

  /**
   * 🚀 Navega a la vista de detalle, pasando el hallazgo completo.
   */
  verDetalle(hallazgo: Hallazgo): void {
    console.log('👁️ Navegando a detalle para:', hallazgo.nombreComun);

    // Navegación a la ruta de detalle (asegúrate de que 'almanac/detalle' está configurado en tu routing)
    this.router.navigate(['almanac/detalle'], {
      state: {
        // 💡 Pasamos el objeto HALLAZGO completo con la clave 'hallazgo',
        // que es lo que espera AlmanacDetailComponent.
        hallazgo: hallazgo 
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
        this.cargarHallazgos();
        this.cancelarEliminacion();
      },
      error: (error) => {
        console.error('❌ Error eliminando hallazgo:', error);
        this.cancelarEliminacion();
      }
    });
  }

  // ============================================
  // 🛠️ MÉTODOS AUXILIARES Y CARRUSEL
  // ============================================

  /**
   * Obtiene la imagen en formato Base64 correctamente formateado.
   */
  getImageSrc(hallazgo: Hallazgo): string {
    // Verifica imagenBase64
    if ('imagenBase64' in hallazgo && hallazgo.imagenBase64) {
      if (hallazgo.imagenBase64.startsWith('data:image')) {
        return hallazgo.imagenBase64;
      }
      return `data:image/jpeg;base64,${hallazgo.imagenBase64}`;
    }
    return 'assets/placeholder-image.png';
  }

  /**
   * Formatea la fecha en la tarjeta (usado en almanac-list.component.html).
   */
  formatFecha(fecha: string): string {
    // Usamos DatePipe en el HTML, pero este método queda por si lo requiere la lógica.
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