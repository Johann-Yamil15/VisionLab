import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../Core/services/gemini.service';
import { Hallazgo } from '../../Core/services/hallazgos.service'; // 💡 Importar Hallazgo
import { ChatMessage } from '../../shared/models/chat-message.model'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 

@Component({
  selector: 'app-almanac-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, MatProgressSpinnerModule], 
  templateUrl: './almanac-detail.component.html',
  styleUrls: ['./almanac-detail.component.scss']
})
export class AlmanacDetailComponent implements OnInit {

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // 📝 Propiedad para almacenar el hallazgo. Usamos Hallazgo.
  hallazgo: Hallazgo | null = null; 
  public analyzedSpecies: string = ''; 

  // Variables de chat
  messages: ChatMessage[] = [];
  userInput: string = '';
  loadingResponse: boolean = false;
  chatInicializado: boolean = false; 

  // Función de utilería para obtener el icono del tipo (similar al listado)
  getTipoIcon(tipo: string): string {
    tipo = tipo ? tipo : ''; // No a toLowerCase para que coincida con el mapa
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

  // Función de utilería para obtener la imagen (CORREGIDA)
  getImageSrc(hallazgo: Hallazgo): string {
    // Verificar si existe la propiedad imagenBase64
    if ('imagenBase64' in hallazgo && hallazgo.imagenBase64) {
      if (hallazgo.imagenBase64.startsWith('data:image')) {
        return hallazgo.imagenBase64;
      }
      return `data:image/jpeg;base64,${hallazgo.imagenBase64}`;
    }
    return 'assets/placeholder-image.jpg'; 
  }

  // Función para volver a la lista
  goBack() {
    this.router.navigate(['/almanac']); // Asegúrate de que esta sea la ruta correcta
  }

  constructor(
    private router: Router, 
    private gemini: GeminiService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    // 💡 Recibe el estado de navegación (el hallazgo)
    const nav = this.router.getCurrentNavigation();
    const hallazgoState = nav?.extras.state?.['hallazgo'] as Hallazgo; // 💡 Usamos Hallazgo
    
    if (hallazgoState) {
      this.hallazgo = hallazgoState;
      this.analyzedSpecies = hallazgoState.nombreComun || hallazgoState.nombreCientifico || 'la especie desconocida';
      this.inicializarChat(); 
    } else {
      console.error('No se recibió el hallazgo en la navegación. Redirigiendo...');
      // Si no hay datos, podrías redirigir para evitar errores en la vista.
      // this.router.navigate(['/almanaque']); 
    }
  }

  ngOnInit() {
    // Puedes llamar a inicializarChat() aquí si es necesario
  }

  inicializarChat() {
    if (this.analyzedSpecies && !this.chatInicializado) {
      this.messages.push({
        text: `Hola, soy tu asistente experto en **${this.analyzedSpecies}**. Hemos analizado tu muestra. ¿Qué más te gustaría saber sobre este espécimen?`,
        sender: 'ai',
        timestamp: new Date()
      });
      this.chatInicializado = true;
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.loadingResponse) return;

    // 1. Añadir mensaje del usuario
    this.messages.push({
      text: text,
      sender: 'user',
      timestamp: new Date()
    });

    this.userInput = '';
    this.loadingResponse = true;
    this.scrollToBottom();

    // 2. Construir prompt de contexto y llamar al servicio
    const contextPrompt = this.buildContextPrompt(text);

    this.gemini.chat(contextPrompt).subscribe({
      next: (response: { text: string }) => {
        this.loadingResponse = false;
        this.messages.push({
          text: response.text, 
          sender: 'ai',
          timestamp: new Date()
        });
        this.scrollToBottom();
      },
      error: (err: any) => { 
        this.loadingResponse = false;
        this.messages.push({
          text: 'Lo siento, no pude contactar al experto. Inténtalo de nuevo.',
          sender: 'ai',
          timestamp: new Date()
        });
        console.error('Error en la API de chat:', err);
        this.scrollToBottom();
      }
    });
  }

  private buildContextPrompt(question: string): string {
    const species = this.analyzedSpecies;

    const restrictionPrompt = `
      Eres un asistente experto enfocado únicamente en la especie ${species}.
      Tu única tarea es responder la siguiente pregunta del usuario SOLO si está directamente relacionada con ${species} y su análisis (Nombre común: ${this.hallazgo?.nombreComun}, Científico: ${this.hallazgo?.nombreCientifico}, Descripción: ${this.hallazgo?.descripcion.substring(0, 100)}...).
      Si la pregunta del usuario es sobre CUALQUIER otra cosa, o es una pregunta general que no tiene que ver con ${species}, debes responder de manera amable pero firme:
      "Mi conocimiento está limitado estrictamente a ${species} y el análisis que se realizó. No puedo responder preguntas sobre otras especies o temas."
      
      Pregunta del usuario: "${question}"
    `;
    return restrictionPrompt;
  }

  scrollToBottom(): void {
    this.cdr.detectChanges(); 
    if (this.messageContainer) {
      try {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      } catch(err) { /* Manejo de error si es necesario */ } 
    }
  }
}