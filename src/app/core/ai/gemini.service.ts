import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { AnalysisResult, Especie } from '../../shared/models/hallazgo.model';
import { ETIQUETAS_IA, GUIA_CATEGORIAS_IA } from '../../shared/utils/tipos';

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
Eres un guía de naturaleza para niños de 7 a 12 años que usan un microscopio digital.
Observa la imagen, identifica el SUJETO PRINCIPAL (lo que está al centro o más enfocado) y
llena todos los campos en español.

CATEGORÍA ("tipo"): elige SIEMPRE exactamente una de estas 12, escrita igual:
${GUIA_CATEGORIAS_IA}

Reglas para elegir la categoría:
- Clasifica el sujeto principal, no el fondo (una mariposa sobre una flor es "Insectos").
- Si dudas entre dos, elige la más específica (una araña es "Insectos"; un hongo sobre un tronco es "Hongos").
- Si no es algo de la naturaleza, usa "Objetos" (o "Metales y materiales" si lo importante es el material).
- Nunca inventes otra categoría ni la dejes vacía.

Campos:
- nombreComun: nombre común en español.
- nombreCientifico: nombre científico; cadena vacía si no aplica (objetos, materiales, fenómenos).
- descripcion: máximo 500 caracteres, lenguaje sencillo y divertido para niños.
- nivelConfianza: entero de 0 a 100 según qué tan seguro estás de la identificación.
- habitat: dónde vive o se encuentra, máximo 4 palabras.
- alimentacion: qué come, máximo 4 palabras; "No aplica" si no come.
- colores: colores principales, máximo 4 palabras.
- tamano: Diminuto, Pequeño, Mediano o Grande.
- lema: una frase divertida para niños, máximo 90 caracteres.`;

  /**
   * Esquema de respuesta: Gemini devuelve JSON con esta forma y "tipo" queda limitado a las
   * 12 categorías (enum), así la carta siempre recibe su fondo correcto.
   */
  private readonly esquemaAnalisis = {
    type: 'OBJECT',
    properties: {
      tipo: { type: 'STRING', format: 'enum', enum: ETIQUETAS_IA },
      nombreComun: { type: 'STRING' },
      nombreCientifico: { type: 'STRING' },
      descripcion: { type: 'STRING' },
      nivelConfianza: { type: 'INTEGER' },
      habitat: { type: 'STRING' },
      alimentacion: { type: 'STRING' },
      colores: { type: 'STRING' },
      tamano: { type: 'STRING', format: 'enum', enum: ['Diminuto', 'Pequeño', 'Mediano', 'Grande'] },
      lema: { type: 'STRING' },
    },
    required: [
      'tipo',
      'nombreComun',
      'nombreCientifico',
      'descripcion',
      'nivelConfianza',
      'habitat',
      'alimentacion',
      'colores',
      'tamano',
      'lema',
    ],
    propertyOrdering: [
      'tipo',
      'nombreComun',
      'nombreCientifico',
      'descripcion',
      'nivelConfianza',
      'habitat',
      'alimentacion',
      'colores',
      'tamano',
      'lema',
    ],
  };

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
      generationConfig: { responseMimeType: 'application/json', responseSchema: this.esquemaAnalisis },
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
