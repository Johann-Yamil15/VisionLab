import { Injectable } from '@angular/core';

export interface CameraCapabilities {
  /** Rango de zoom óptico/hardware si el dispositivo lo soporta (si no, se usa zoom digital). */
  zoom: { min: number; max: number; step: number } | null;
  torch: boolean;
}

/** Lado mayor de la foto enviada a la IA: suficiente detalle y peso razonable. */
const MAX_LADO = 1280;
const CALIDAD_JPEG = 0.85;

@Injectable({ providedIn: 'root' })
export class CameraService {
  private stream: MediaStream | null = null;

  get disponible(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  }

  async start(): Promise<MediaStream> {
    this.stop();
    const video = { width: { ideal: 1920 }, height: { ideal: 1080 } };
    try {
      // Cámara trasera en celulares.
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { ...video, facingMode: { ideal: 'environment' } },
        audio: false,
      });
    } catch {
      // Laptops / escritorio: cualquier cámara disponible.
      this.stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
    }
    return this.stream;
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  capabilities(): CameraCapabilities {
    const caps = (this.track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
      zoom?: { min: number; max: number; step: number };
      torch?: boolean;
    };
    const zoom = caps.zoom && caps.zoom.max > caps.zoom.min ? caps.zoom : null;
    return { zoom, torch: !!caps.torch };
  }

  async setZoom(value: number): Promise<void> {
    await this.track?.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] });
  }

  async setTorch(on: boolean): Promise<void> {
    await this.track?.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
  }

  /**
   * Toma la foto de lo que se ve: recorta el centro según el zoom digital y reduce el tamaño.
   */
  capture(video: HTMLVideoElement, zoomDigital = 1): string | null {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    const sw = vw / zoomDigital;
    const sh = vh / zoomDigital;
    const escala = Math.min(1, MAX_LADO / Math.max(sw, sh));

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw * escala);
    canvas.height = Math.round(sh * escala);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', CALIDAD_JPEG);
  }

  /** Reduce una imagen subida desde la galería al mismo tamaño máximo que las capturas. */
  async fromFile(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', CALIDAD_JPEG);
  }

  private get track(): MediaStreamTrack | undefined {
    return this.stream?.getVideoTracks()[0];
  }
}
