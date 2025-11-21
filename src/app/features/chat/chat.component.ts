import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../Core/services/gemini.service';
import { AnalysisResult } from '../../shared/models/analysis-result.model';
import { ChatMessage } from '../../shared/models/chat-message.model'; 
import { Observable } from 'rxjs'; 

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // Datos pasados del análisis
  analysisResult?: AnalysisResult;
  // 🟢 CORRECCIÓN: 'public' para ser accesible desde el HTML.
  public analyzedSpecies: string = ''; 

  // Variables de chat
  messages: ChatMessage[] = [];
  userInput: string = '';
  loadingResponse: boolean = false;

  constructor(
    private router: Router, 
    private gemini: GeminiService,
    private cdr: ChangeDetectorRef
  ) {
    const nav = this.router.getCurrentNavigation();
    const resultState = nav?.extras.state?.['result'] as AnalysisResult;
    
    if (resultState) {
      this.analysisResult = resultState;
      this.analyzedSpecies = resultState.nombreComun || resultState.nombreCientifico || 'la especie desconocida';
    }
  }

  ngOnInit() {
    if (this.analyzedSpecies) {
      this.messages.push({
        text: `Hola, soy tu asistente experto en ${this.analyzedSpecies}. ¿Qué más te gustaría saber sobre este espécimen?`,
        sender: 'ai',
        timestamp: new Date()
      });
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.loadingResponse) return;

    this.messages.push({
      text: text,
      sender: 'user',
      timestamp: new Date()
    });

    this.userInput = '';
    this.loadingResponse = true;
    this.scrollToBottom();

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
      Tu única tarea es responder la siguiente pregunta del usuario SOLO si está directamente relacionada con ${species}.
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
      } catch(err) { }                 
    }
  }
}