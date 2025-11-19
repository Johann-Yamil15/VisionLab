import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AnalysisResult } from '../../shared/models/analysis-result.model';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeminiService {

  private API_KEY = 'TU_API_KEY';
  private URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  private prompt = `
Analiza la imagen proporcionada.
Clasifica qué es (insecto, hoja, roca, hongo, rama, objeto artificial, etc).
Respóndeme únicamente en formato JSON válido con la siguiente estructura:

{
  "tipo": "",
  "nombreComun": "",
  "nombreCientifico": "",
  "descripcion": "",
  "nivelConfianza": ""
}

No incluyas texto fuera del JSON.
`;

  constructor(private http: HttpClient) {}

  analyze(imageBase64: string): Observable<AnalysisResult> {
    const payload = {
      contents: [
        {
          parts: [
            { text: this.prompt },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64.split(',')[1] } }
          ]
        }
      ]
    };

    return this.http
      .post<any>(`${this.URL}?key=${this.API_KEY}`, payload)
      .pipe(
        map(res => {
          const text = res?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          return JSON.parse(text) as AnalysisResult;
        })
      );
  }
}
