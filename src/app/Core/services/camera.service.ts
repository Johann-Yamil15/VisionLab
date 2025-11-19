import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CameraService {

  private videoElement!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private stream: MediaStream | null = null;

  async startCamera(): Promise<MediaStream> {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true });

    this.videoElement = document.querySelector('#cameraVideo') as HTMLVideoElement;
    this.videoElement.srcObject = this.stream;
    await this.videoElement.play();

    return this.stream;
  }

  stopCamera() {
    this.stream?.getTracks().forEach(t => t.stop());
  }

  capturePhoto(): string {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;

    const ctx = this.canvas.getContext('2d')!;
    ctx.drawImage(this.videoElement, 0, 0);

    return this.canvas.toDataURL('image/jpeg');
  }
}
