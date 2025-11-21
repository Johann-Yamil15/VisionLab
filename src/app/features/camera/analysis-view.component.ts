import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// ⚠️ Asegúrate de que las rutas a tus componentes sean correctas
import { ResultsComponent } from '../camera/results.component'; 
import { ChatComponent } from '../chat/chat.component';

@Component({
  selector: 'app-analysis-view',
  standalone: true,
  // Importamos los componentes de Resultados y Chat para usarlos en el template
  imports: [CommonModule, ResultsComponent, ChatComponent], 
  templateUrl: './analysis-view.component.html',
  styleUrls: ['./analysis-view.component.scss']
})
export class AnalysisViewComponent {
  // Nota: La data (AnalysisResult) debe ser cargada aquí y pasada a los hijos 
  // si el ChatComponent no pudiese accederla directamente via Router State.
  // Por simplicidad, el ChatComponent seguirá usando el Router State por ahora.
}