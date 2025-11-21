import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule], // Asumiendo que CommonModule es necesario.
  templateUrl: './legal.component.html', // ⬅️ Asegúrate de que esta ruta sea correcta
  styleUrls: ['./legal.component.scss'] // ⬅️ Asegúrate de que esta ruta sea correcta
})
export class LegalComponent {
  // Aquí no necesitas lógica para esta vista informativa
}