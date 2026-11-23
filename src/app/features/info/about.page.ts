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
          <h1>Acerca de OmniScan</h1>
          <p class="page-subtitle">Bio-escáner con IA y Atlas 3D para despertar la curiosidad científica.</p>
        </div>
      </header>

      <div class="grid">
        <article class="clay item">
          <span class="item-icon" style="--c: var(--c-primary)"><lucide-icon [img]="icons.Microscope" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>¿Qué es?</h2>
            <p>
              OmniScan convierte un celular o una computadora en un bio-escáner con inteligencia artificial. Fotografías
              lo que encuentras en la naturaleza, descubres qué es y lo guardas como una tarjeta en tu almanaque, mientras
              subes de rango y ganas medallas. Con el Atlas 3D recorres el planeta y exploras especies de todo el mundo.
            </p>
          </div>
        </article>

        <article class="clay item">
          <span class="item-icon" style="--c: var(--c-secondary)"><lucide-icon [img]="icons.Sparkles" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>Cómo funciona</h2>
            <p>
              La IA analiza la foto y explica el hallazgo: hábitat, alimentación y si es peligroso. Después, un asistente
              experto responde preguntas solo sobre esa especie. Las especies repetidas suman fotos a su galería.
            </p>
          </div>
        </article>

        <article class="clay item">
          <span class="item-icon" style="--c: var(--c-primary)"><lucide-icon [img]="icons.Globe" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>Atlas Vivo 3D</h2>
            <p>
              Un globo terráqueo con fauna, flora y minerales. Cada especie tiene su modelo 3D, sonidos, puntos de
              interés y, en algunas, su ruta migratoria. También funciona en los visores de realidad virtual.
            </p>
          </div>
        </article>

        <article class="clay item">
          <span class="item-icon" style="--c: var(--c-sun-strong)"><lucide-icon [img]="icons.Trophy" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>Nuestra meta</h2>
            <p>
              Estimular la curiosidad, la observación detallada y el aprendizaje experimental, en un entorno seguro y
              divertido para jóvenes de 12 a 18 años.
            </p>
          </div>
        </article>

        <article class="clay item">
          <span class="item-icon" style="--c: var(--c-berry)"><lucide-icon [img]="icons.Users" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>El equipo</h2>
            <p>
              Hecho por <strong>Johann, Jesús y Guillermo</strong>: Atlas y escáner, visor 3D e inteligencia artificial.
              Proyecto para el concurso del museo El Rehilete, Pachuca.
            </p>
          </div>
        </article>

        <article class="clay item note">
          <span class="item-icon" style="--c: var(--c-text-muted)"><lucide-icon [img]="icons.Info" [size]="28" aria-hidden="true" /></span>
          <div>
            <h2>Importante</h2>
            <p>
              La inteligencia artificial puede equivocarse. Usa OmniScan con un adulto y nunca toques animales, plantas
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
      @media (min-width: 768px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      @media (min-width: 1280px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    .item {
      display: flex;
      gap: var(--s-4);
      padding: var(--s-5);
      // En columnas el ícono va arriba para que el texto use todo el ancho.
      @media (min-width: 768px) { flex-direction: column; gap: var(--s-3); }
      h2 { font-size: var(--fs-lg); margin-bottom: var(--s-2); }
      p { line-height: 1.7; }
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
