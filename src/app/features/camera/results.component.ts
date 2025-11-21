import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
import { AnalysisResult } from '../../shared/models/analysis-result.model';
import { HallazgosService } from '../../Core/services/hallazgos.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule], 
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent { 
  
  // Propiedades para mostrar
  photo: string = '';
  result?: AnalysisResult;
  loading: boolean = false;
  
  // 🟢 NUEVAS PROPIEDADES PARA EL GUARDADO
  saving: boolean = false;
  saveSuccess: boolean = false;
  saveError: string | null = null;

  constructor(
    private router: Router,
    private hallazgosService: HallazgosService
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state;

    if (state && state['result']) {
      this.result = state['result'] as AnalysisResult;
      this.photo = state['photo'] as string;
      
      console.log('ResultsComponent | ✅ Resultados pre-analizados cargados.');
      
      // 🟢 GUARDAR AUTOMÁTICAMENTE
      this.guardarHallazgo();
    } else {
      console.warn('ResultsComponent | ⚠️ No se encontró el resultado del análisis en el Router State.');
      this.router.navigate(['/camera']);
    }
  }

  /**
   * Guarda el hallazgo automáticamente en la base de datos
   */
  guardarHallazgo(): void {
    if (!this.result || this.saving || this.saveSuccess) {
      return;
    }

    this.saving = true;
    this.saveError = null;
    console.log('💾 ResultsComponent | Guardando hallazgo automáticamente...');

    this.hallazgosService.createFromAnalysis(
      this.result,
      this.photo,
      'usuario_actual' // 👤 Cambia esto por el ID del usuario autenticado
    ).subscribe({
      next: (hallazgo) => {
        console.log('✅ ResultsComponent | Hallazgo guardado exitosamente:', hallazgo);
        this.saving = false;
        this.saveSuccess = true;
        
        // Ocultar notificación de éxito después de 3 segundos
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (error) => {
        console.error('❌ ResultsComponent | Error guardando hallazgo:', error);
        this.saving = false;
        this.saveError = 'No se pudo guardar el hallazgo. Intenta nuevamente.';
      }
    });
  }

  /**
   * Reintenta guardar si hubo un error
   */
  reintentarGuardado(): void {
    this.saveSuccess = false;
    this.saveError = null;
    this.guardarHallazgo();
  }

  /**
   * Volver a tomar otra foto
   */
  retake(): void {
    this.router.navigate(['/camera']);
  }

  /**
   * Navegar al almanaque
   */
  verAlmanaque(): void {
    this.router.navigate(['/almanac']);
  }
}