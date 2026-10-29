import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AppIcons } from '../../shared/ui/icons';

@Component({
  selector: 'app-about-page',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page about">
      <header class="page-header">
        <div>
          <h1>Acerca de VisionLab</h1>
          <p class="page-subtitle">Un microscopio digital para despertar la curiosidad científica.</p>
        </div>
      </header>

      <div class="grid">
        <article class="clay item item--wide">
          <span class="item-icon" style="--c: var(--c-primary)"><lucide-icon [img]="icons.Microscope" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>¿Qué es?</h2>
            <p>
              VisionLab convierte un celular o una computadora en un microscopio con inteligencia artificial. Los niños
              fotografían lo que encuentran en la naturaleza, descubren qué es y lo guardan como una tarjeta en su
              almanaque, mientras ganan puntos y medallas.
            </p>
          </div>
        </article>

        <article class="clay item">
          <span class="item-icon" style="--c: var(--c-secondary)"><lucide-icon [img]="icons.Sparkles" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>Cómo funciona</h2>
            <p>
              La IA observa la foto y explica el hallazgo con palabras sencillas. Después, un asistente experto responde
              preguntas solo sobre esa especie, para aprender sin distraerse.
            </p>
          </div>
        </article>

        <article class="clay item">
          <span class="item-icon" style="--c: var(--c-sun-strong)"><lucide-icon [img]="icons.Trophy" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>Nuestra meta</h2>
            <p>
              Estimular la curiosidad, la observación detallada y el aprendizaje experimental, en un entorno seguro y
              divertido para niños de 7 a 12 años.
            </p>
          </div>
        </article>

        <article class="clay item item--wide">
          <span class="item-icon" style="--c: var(--c-berry)"><lucide-icon [img]="icons.Users" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>El equipo</h2>
            <p>
              Hecho por <strong>Johann, Guillermo, Joel y Miguel</strong>: diseño visual, desarrollo, interacción y
              gamificación. Propuesta para el museo El Rehilete, Pachuca.
            </p>
          </div>
        </article>

        <article class="clay item item--wide note">
          <span class="item-icon" style="--c: var(--c-text-muted)"><lucide-icon [img]="icons.Info" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>Importante</h2>
            <p>
              La inteligencia artificial puede equivocarse. Usa VisionLab con un adulto y nunca toques animales, plantas
              u hongos que no conozcas.
            </p>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: `
    .grid {
      display: grid;
      gap: var(--s-4);
      @media (min-width: 768px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .item {
      display: flex;
      gap: var(--s-4);
      padding: var(--s-5);
      h2 { font-size: var(--fs-lg); margin-bottom: var(--s-2); }
      p { line-height: 1.7; }
    }
    .item--wide {
      @media (min-width: 768px) { grid-column: 1 / -1; }
    }
    .item-icon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      border-radius: var(--r-sm);
      background: var(--c);
      color: #fff;
      border: var(--border-clay);
      box-shadow: 0 4px 0 var(--c-ink);
    }
    .note { background: var(--c-warning-bg); }
  `,
})
export class AboutPage {
  protected readonly icons = AppIcons;
}
