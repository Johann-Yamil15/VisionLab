import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AnalysisResult } from '../../shared/models/analysis-result.model';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeminiService {

  private API_KEY = 'AIzaSyB-cDigqMVC6gDRVmX0Qol_TT0KvbYzZ_o';
private URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
//                                                         ^^^^^^^^^^^^^^^^^^^^^^^ <-- CORRECCIÓN CLAVE

  private prompt = `
Analiza la imagen proporcionada.
Clasifica qué es (insecto, hoja, roca, hongo, rama, objeto artificial, etc).
Respóndeme únicamente en formato JSON válido con la siguiente estructura:

{
  "tipo": "",
  "nombreComun": "",
  "nombreCientifico": "",
  "descripcion": "un mazimo de 500 caracteres no mas",
  "nivelConfianza": " de 0 a 100(ej., "95"y no agregues este simbolo: % )",
}

No incluyas texto fuera del JSON.
`;

  constructor(private http: HttpClient) {}

  analyze(imageBase64: string): Observable<AnalysisResult> {
    const base64Data = imageBase64.split(',')[1];
    
    const payload = {
      contents: [
        {
          parts: [
            { text: this.prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
          ]
        }
      ]
    };

    const fullUrl = `${this.URL}?key=${this.API_KEY}`;
    console.log('GeminiService | 🚀 Enviando petición a:', fullUrl);
    console.log('GeminiService | 📏 Tamaño de imagen Base64 (bytes):', base64Data.length);

    return this.http
      .post<any>(fullUrl, payload)
      .pipe(
        map(res => {
          let text = res?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          
          console.log('GeminiService | ✅ Respuesta cruda recibida:', text);
          
          // 🟢 CORRECCIÓN CLAVE: Limpiar la respuesta de bloques de código Markdown
          text = text.trim()
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '');

          console.log('GeminiService | 🧹 Respuesta limpiada (JSON puro):', text);
          
          try {
             const result = JSON.parse(text) as AnalysisResult;
             console.log('GeminiService | ✨ JSON parseado exitoso:', result);
             return result;
          } catch (e) {
             console.error('GeminiService | ❌ Error al parsear JSON después de limpiar:', e, 'Texto recibido (limpiado):', text);
             throw new Error('Respuesta de Gemini no es JSON válido o está incompleto.');
          }
        })
      );
  }
}