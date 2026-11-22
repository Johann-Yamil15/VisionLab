import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AppIcons } from '../icons';
import { ToastService } from './toast.service';

/** Pila de notificaciones arriba a la derecha; se cierran solas a los 6 s. */
@Component({
  selector: 'app-toasts',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="pila" aria-live="polite" aria-label="Notificaciones">
      @for (t of servicio.toasts(); track t.id) {
        <li class="aviso" [class.aviso--medalla]="t.tipo === 'medalla'" [class.aviso--nivel]="t.tipo === 'nivel'">
          @if (t.imagen) {
            <img class="aviso-img" [src]="t.imagen" alt="" width="56" height="56" />
          } @else {
            <span class="aviso-icono" aria-hidden="true">
              <lucide-icon [img]="t.tipo === 'nivel' ? icons.Crown : icons.Sparkles" [size]="24" />
            </span>
          }
          <div class="aviso-texto">
            <strong>{{ t.titulo }}</strong>
            <span>{{ t.texto }}</span>
          </div>
          <button type="button" class="aviso-cerrar" aria-label="Cerrar notificación" (click)="servicio.cerrar(t.id)">
            <lucide-icon [img]="icons.X" [size]="16" aria-hidden="true" />
          </button>
        </li>
      }
    </ol>
  `,
  styles: `
    .pila {
      position: fixed;
      z-index: 1000;
      top: var(--s-4);
      right: var(--s-4);
      left: var(--s-4);
      display: grid;
      justify-items: end;
      gap: var(--s-2);
      margin: 0;
      padding: 0;
      list-style: none;
      pointer-events: none;
    }

    .aviso {
      --acento: var(--c-primary);
      --acento-borde: var(--c-primary-strong);

      display: flex;
      align-items: center;
      gap: var(--s-3);
      width: min(100%, 360px);
      padding: var(--s-3);
      border: var(--border-clay);
      border-radius: var(--r-md);
      background: var(--c-surface);
      color: var(--c-text);
      box-shadow: 0 4px 0 var(--c-ink);
      pointer-events: auto;
      animation: entrar 0.35s var(--ease-spring);
    }

    .aviso--medalla {
      --acento: var(--c-sun);
      --acento-borde: var(--c-sun-strong);
    }

    .aviso--nivel {
      --acento: var(--c-secondary);
      --acento-borde: var(--c-secondary-strong);
    }

    .aviso-img {
      flex: none;
      width: 56px;
      height: 56px;
      object-fit: contain;
      animation: brillo 1.2s ease-out;
    }

    // Insignia del ícono: cuadrado redondeado con el color de acento y sombra sólida.
    .aviso-icono {
      display: grid;
      flex: none;
      place-items: center;
      width: 44px;
      height: 44px;
      border: 2px solid var(--c-ink);
      border-bottom-width: 4px;
      border-radius: var(--r-sm);
      background: var(--acento);
      color: var(--c-on-primary);
    }

    .aviso--medalla .aviso-icono {
      color: var(--c-on-sun);
    }

    .aviso-texto {
      display: grid;
      flex: 1;
      gap: 2px;
      min-width: 0;

      strong {
        font-family: var(--font-display);
        font-size: var(--fs-md);
      }

      span {
        font-size: var(--fs-sm);
        color: var(--c-text-muted);
      }
    }

    .aviso-cerrar {
      display: grid;
      flex: none;
      place-items: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: 2px solid var(--c-border);
      border-radius: 50%;
      background: var(--c-surface);
      color: var(--c-text);
      cursor: pointer;

      &:hover {
        border-color: var(--c-ink);
        background: var(--c-bg-alt);
      }
    }

    @keyframes entrar {
      from {
        opacity: 0;
        transform: translateX(24px) scale(0.96);
      }
    }

    @keyframes brillo {
      from {
        transform: scale(0.4) rotate(-20deg);
        filter: drop-shadow(0 0 12px var(--c-sun));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .aviso,
      .aviso-img {
        animation: none;
      }
    }
  `,
})
export class ToastsComponent {
  protected readonly servicio = inject(ToastService);
  protected readonly icons = AppIcons;
}
