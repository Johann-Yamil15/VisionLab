import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../Core/services/gemini.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalysisResult } from '../../shared/models/analysis-result.model';

@Component({
  selector: 'app-preview',
  standalone: true,
  // Aseguramos la importación del spinner para el estado de carga
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent {
  photo: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private gemini: GeminiService // ⬅️ Inyectamos GeminiService
  ) {
    const nav = this.router.getCurrentNavigation();
    this.photo = nav?.extras.state?.['photo'] ?? '';

    // Si no hay foto, redirigir a la cámara (manejo de caso extremo)
    if (!this.photo) {
      this.router.navigate(['/camera']);
    }
  }

  /**
   * Ejecuta el análisis de la imagen y navega a la vista unificada.
   */
  analyze() {
    if (this.loading || !this.photo) return;

    this.loading = true;
    console.log('PreviewComponent | ⏱️ Iniciando análisis de la imagen...');

    // 1. Llama al servicio de Gemini
    this.gemini.analyze(this.photo).subscribe({
      next: (result: AnalysisResult) => {
        this.loading = false;
        console.log('PreviewComponent | ✅ Análisis completado. Navegando...');

        // 2. Navega a la nueva vista unificada, pasando la foto y el resultado
        // 🟢 CORRECCIÓN: Cambiado a la ruta definida en app.routes.ts
        this.router.navigate(['/analysis'], {
          state: {
            photo: this.photo,
            result: result // ⬅️ Dato CLAVE
          }
        });
      },
      error: (err: any) => {
        this.loading = false;
        console.error('PreviewComponent | ❌ Error durante el análisis:', err);
        // Usamos una alerta customizada o mensaje en una aplicación real
        alert('Error al analizar la imagen. Por favor, revisa la consola para más detalles.');
      }
    });
  }

  /**
   * Vuelve a la vista de captura de cámara.
   */
  retake() {
    this.router.navigate(['/camera']);
  }
}