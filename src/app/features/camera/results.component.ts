import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
import { AnalysisResult } from '../../shared/models/analysis-result.model';

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
  
  // AÑADIDO/CORREGIDO: loading se inicializa en falso para resolver el error TS2339
  // ya que el componente se carga con el resultado listo.
  loading: boolean = false;

  constructor(
    private router: Router
  ) {
    // 1. Obtener la data (photo y result) del estado de navegación
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras.state;

    if (state && state['result']) {
      this.result = state['result'] as AnalysisResult;
      this.photo = state['photo'] as string;
      
      console.log('ResultsComponent | ✅ Resultados pre-analizados cargados.');
    } else {
      console.warn('ResultsComponent | ⚠️ No se encontró el resultado del análisis en el Router State.');
      // Redirigir o manejar el error
    }
  }

  // Método para volver a la cámara
  retake() {
    this.router.navigate(['/camera']);
  }
}