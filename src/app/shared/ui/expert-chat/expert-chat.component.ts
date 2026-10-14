import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { GeminiService, IaNoDisponibleError } from '../../../core/ai/gemini.service';
import { ChatMessage } from '../../models/chat-message.model';
import { Especie } from '../../models/hallazgo.model';
import { textoIaAHtml } from '../../utils/texto-ia';
import { AppIcons } from '../icons';

const SUGERENCIAS = ['¿Qué come?', '¿Dónde vive?', '¿Es peligroso?', 'Dime un dato curioso'];

@Component({
  selector: 'app-expert-chat',
  imports: [FormsModule, DatePipe, LucideAngularModule],
  templateUrl: './expert-chat.component.html',
  styleUrl: './expert-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertChatComponent implements OnInit {
  readonly especie = input.required<Especie>();

  private readonly gemini = inject(GeminiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');

  protected readonly icons = AppIcons;
  protected readonly sugerencias = SUGERENCIAS;
  protected readonly mensajes = signal<ChatMessage[]>([]);
  protected readonly pensando = signal(false);
  protected readonly toHtml = textoIaAHtml;
  protected pregunta = '';

  ngOnInit(): void {
    const nombre = this.especie().nombreComun || 'esta especie';
    this.agregar({
      sender: 'ai',
      text: `¡Hola, explorador! Sé muchas cosas sobre **${nombre}**. ¿Qué quieres saber?`,
      timestamp: new Date(),
    });
  }

  protected enviar(texto = this.pregunta): void {
    const pregunta = texto.trim();
    if (!pregunta || this.pensando()) return;

    this.pregunta = '';
    this.agregar({ sender: 'user', text: pregunta, timestamp: new Date() });
    this.pensando.set(true);

    this.gemini
      .chat(this.especie(), pregunta)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.pensando.set(false);
          this.agregar({ sender: 'ai', text: respuesta || 'Hmm, no sé qué decir. ¿Lo preguntas de otra forma?', timestamp: new Date() });
        },
        error: (err) => {
          this.pensando.set(false);
          this.agregar({
            sender: 'ai',
            error: true,
            timestamp: new Date(),
            text:
              err instanceof IaNoDisponibleError
                ? err.message
                : 'No pude contestar ahora. Revisa tu conexión e inténtalo otra vez.',
          });
        },
      });
  }

  private agregar(mensaje: ChatMessage): void {
    this.mensajes.update((m) => [...m, mensaje]);
    afterNextRender(
      () => {
        const el = this.lista()?.nativeElement;
        el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      },
      { injector: this.injector },
    );
  }
}
