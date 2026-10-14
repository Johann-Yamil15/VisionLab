import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { AnalysisResult, Especie } from '../../shared/models/hallazgo.model';
import { CATEGORIAS_IA } from '../../shared/utils/tipos';

/** Error que se muestra cuando la IA aún no está disponible desde el servidor. */
export class IaNoDisponibleError extends Error {
  constructor() {
    super('El análisis con IA está en mantenimiento. ¡Vuelve pronto!');
  }
}

/**
 * TEMPORAL: llama a Gemini desde el navegador. Se reemplaza por los endpoints
 * /api/analisis y /api/chat del backend (la llave NUNCA debe vivir en el frontend).
 * Mientras tanto, sin llave responde con IaNoDisponibleError.
 */
@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly http = inject(HttpClient);
  private readonly apiKey = '';
  private readonly url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  private readonly promptAnalisis = `
Eres un guía de naturaleza para niños de 7 a 12 años. Analiza la imagen y responde SOLO con JSON válido:
{
  "tipo": "exactamente una de estas categorías: ${CATEGORIAS_IA}",
  "nombreComun": "nombre común en español",
  "nombreCientifico": "nombre científico o cadena vacía si no aplica",
  "descripcion": "máximo 500 caracteres, lenguaje sencillo y divertido para niños",
  "nivelConfianza": número entero de 0 a 100,
  "habitat": "dónde vive, máximo 4 palabras (ej. Jardines y campos)",
  "alimentacion": "qué come, máximo 4 palabras; si no come, escribe No aplica",
  "colores": "colores principales, máximo 4 palabras",
  "tamano": "Diminuto, Pequeño, Mediano o Grande",
  "lema": "una frase divertida para niños de máximo 90 caracteres"
}`;

  analyze(imageDataUrl: string): Observable<AnalysisResult> {
    if (!this.apiKey) return throwError(() => new IaNoDisponibleError());

    const payload = {
      contents: [
        {
          parts: [
            { text: this.promptAnalisis },
            { inline_data: { mime_type: 'image/jpeg', data: imageDataUrl.split(',')[1] } },
          ],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    };

    return this.post(payload).pipe(
      map((text) => {
        const r = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '')) as AnalysisResult;
        return { ...r, nivelConfianza: Number(r.nivelConfianza) || 0 };
      }),
    );
  }

  chat(especie: Especie, pregunta: string): Observable<string> {
    if (!this.apiKey) return throwError(() => new IaNoDisponibleError());

    const prompt = `
Eres un experto amable que habla con un niño de 7 a 12 años sobre ${especie.nombreComun}
(${especie.nombreCientifico}). Contexto: ${especie.descripcion.slice(0, 300)}
Responde en español, corto (máximo 4 oraciones) y fácil de entender.
Si la pregunta no trata sobre esta especie, responde amablemente que solo puedes hablar de ella.
Pregunta: "${pregunta}"`;

    return this.post({ contents: [{ parts: [{ text: prompt }] }] });
  }

  private post(payload: unknown): Observable<string> {
    return this.http
      .post<any>(`${this.url}?key=${this.apiKey}`, payload)
      .pipe(map((res) => res?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''));
  }
}
