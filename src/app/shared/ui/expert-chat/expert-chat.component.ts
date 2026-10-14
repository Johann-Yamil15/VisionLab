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
import { LucideAngularModule } from 'lucide-angular';
import { GeminiService, IaNoDisponibleError } from '../../../core/ai/gemini.service';
import { ChatMessage } from '../../models/chat-message.model';
import { Especie } from '../../models/hallazgo.model';
import { textoIaAHtml } from '../../utils/texto-ia';
import { AppIcons } from '../icons';

const SUGERENCIAS = [
  { label: '¿Qué come?', pregunta: '¿Qué come?' },
  { label: '¿Dónde vive?', pregunta: '¿Dónde vive?' },
  { label: '¿Es peligroso?', pregunta: '¿Es peligroso?' },
  { label: 'Dato curioso', pregunta: 'Dime un dato curioso' },
];

@Component({
  selector: 'app-expert-chat',
  imports: [FormsModule, LucideAngularModule],
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
  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campo');

  protected readonly icons = AppIcons;
  protected readonly sugerencias = SUGERENCIAS;
  protected readonly mensajes = signal<ChatMessage[]>([]);
  protected readonly pensando = signal(false);
  protected readonly toHtml = textoIaAHtml;
  protected pregunta = '';

  /** Nombre en minúscula inicial para frases como "Sabe todo sobre la mariquita…". */
  protected readonly sobre = () => {
    const n = this.especie().nombreComun?.trim();
    return n ? n.charAt(0).toLowerCase() + n.slice(1) : 'tu hallazgo';
  };

  /** Lleva el foco al campo de pregunta (botón "Preguntar al experto"). */
  enfocar(): void {
    const el = this.campo()?.nativeElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  }

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
