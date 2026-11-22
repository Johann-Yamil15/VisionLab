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
      display: flex;
      align-items: center;
      gap: var(--s-3);
      width: min(100%, 360px);
      padding: var(--s-3);
      border: 1px solid rgb(94 234 212 / 35%);
      border-radius: 14px;
      background: rgb(6 14 24 / 88%);
      backdrop-filter: blur(10px);
      color: #e6fffb;
      box-shadow: 0 10px 30px rgb(0 0 0 / 35%), 0 0 18px rgb(94 234 212 / 15%);
      pointer-events: auto;
      animation: entrar 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2);
    }

    .aviso--medalla {
      border-color: rgb(251 191 36 / 60%);
      box-shadow: 0 10px 30px rgb(0 0 0 / 35%), 0 0 22px rgb(251 191 36 / 30%);
    }

    .aviso--nivel {
      border-color: rgb(167 139 250 / 60%);
    }

    .aviso-img {
      flex: none;
      width: 56px;
      height: 56px;
      object-fit: contain;
      animation: brillo 1.2s ease-out;
    }

    .aviso-icono {
      display: grid;
      flex: none;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgb(94 234 212 / 15%);
      color: #5eead4;
    }

    .aviso--nivel .aviso-icono {
      background: rgb(167 139 250 / 18%);
      color: #c4b5fd;
    }

    .aviso-texto {
      display: grid;
      flex: 1;
      gap: 2px;
      min-width: 0;

      strong {
        font-size: 0.95rem;
      }

      span {
        font-size: 0.85rem;
        color: #b6d6d1;
      }
    }

    .aviso--medalla strong {
      color: #fbbf24;
    }

    .aviso-cerrar {
      display: grid;
      flex: none;
      place-items: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: rgb(255 255 255 / 8%);
      color: inherit;
      cursor: pointer;
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
        filter: drop-shadow(0 0 16px #fbbf24);
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
