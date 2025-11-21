// src/app/results/results.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // ⬅️ ChangeDetectorRef agregado
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AnalysisResult } from '../../shared/models/analysis-result.model';
import { GeminiService } from '../../Core/services/gemini.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
})
export class ResultsComponent implements OnInit {

  photo = '';
  result?: AnalysisResult;
  loading = true;

  private hasExecuted = false;

  constructor(
    private router: Router, 
    private gemini: GeminiService,
    private cdr: ChangeDetectorRef // ⬅️ Inyectamos ChangeDetectorRef para forzar la actualización
  ) {
    // 1. Obtiene la imagen Base64 pasada por el estado de navegación
    const nav = this.router.getCurrentNavigation();
    this.photo = nav?.extras.state?.['photo'] ?? '';
  }

  ngOnInit() {

    // 🔥 PROTECCIÓN ABSOLUTA CONTRA RE-RENDERING
    if (this.hasExecuted) return;
    this.hasExecuted = true;

    if (!this.photo) {
      this.loading = false;
      this.cdr.detectChanges(); // Forzamos la detección si no hay foto.
      console.warn('ResultsComponent | ⚠️ No se encontró la foto Base64.');
      return;
    }

    // 2. Llama al servicio de Gemini
    console.log('ResultsComponent | ⏱️ Iniciando llamada al GeminiService...');
    this.gemini.analyze(this.photo).subscribe({
      next: (res) => {
        // 3. Éxito: Asigna el resultado y desactiva el loading
        this.result = res;
        this.loading = false;
        
        // 🟢 CLAVE: Forzar la detección de cambios para actualizar el HTML
        this.cdr.detectChanges(); 
        console.log('ResultsComponent | ✅ Análisis completado. Resultados visibles.');

      },
      error: (err) => {
        // 4. Error: Desactiva el loading y notifica
        this.loading = false;
        this.cdr.detectChanges(); 
        console.error('ResultsComponent | ❌ Error en la suscripción del análisis:', err);
        alert('Error al analizar la imagen. Por favor, inténtalo de nuevo.');
      }
    });
  }
}