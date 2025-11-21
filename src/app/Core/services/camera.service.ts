import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private platformId = inject(PLATFORM_ID);
  private stream: MediaStream | null = null;

  async startCamera(): Promise<MediaStream | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      // Intentar cámara trasera primero (móviles)
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      return this.stream;
    } catch (error) {
      console.log('No se pudo acceder a cámara trasera, intentando cámara frontal...');
      
      try {
        // Si falla, usar cámara frontal (laptops/desktops)
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        return this.stream;
      } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        return null;
      }
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  capturePhoto(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const video = document.querySelector('video');
    if (!video) {
      console.error('No se encontró elemento video');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener contexto 2D');
      return null;
    }

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }
}