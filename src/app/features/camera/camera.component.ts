import { Component, OnDestroy, PLATFORM_ID, inject, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { CameraService } from '../../Core/services/camera.service';

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements OnDestroy, AfterViewInit {
  @ViewChild('videoElement', { static: false }) videoElement?: ElementRef<HTMLVideoElement>;
  // Referencia al input de archivo (Nuevo)
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>; 

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private initializationInProgress = false;
  private destroyed = false;
  
  isLoading = true;
  videoStream: MediaStream | null = null;
  errorMessage: string = '';
  showVideo = true; 

  constructor(
    private cameraService: CameraService,
    private router: Router
  ) {
    console.log('📱 CameraComponent constructor');
  }

  // ... (ngAfterViewInit y initCamera permanecen iguales, con las mejoras de robustez)

  async ngAfterViewInit() {
    // ... (Lógica de AfterViewInit) ...
    
    if (!isPlatformBrowser(this.platformId)) {
      this.isLoading = false;
      this.errorMessage = 'La cámara solo funciona en el navegador';
      this.cdr.detectChanges();
      return;
    }

    if (this.initializationInProgress) {
      console.log('⚠️ Inicialización ya en progreso, saltando...');
      return;
    }

    requestAnimationFrame(() => {
      if (!this.destroyed) {
        this.initCamera();
      }
    });
  }

  async initCamera() {
    // ... (Lógica para iniciar la cámara - Sin cambios funcionales, solo la verificación de destrucción) ...
    // Nota: Es mejor que intente iniciar la cámara por si acaso, aunque falle.
    
    if (this.initializationInProgress || this.destroyed) return;

    this.initializationInProgress = true;

    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
      
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 100);
          });
        });
      });

      if (this.destroyed) return;

      if (!this.videoElement?.nativeElement) {
        throw new Error('Elemento de video no disponible');
      }

      const videoEl = this.videoElement.nativeElement;
      this.videoStream = await this.cameraService.startCamera();

      if (this.destroyed) {
        this.cameraService.stopCamera();
        return;
      }

      if (!this.videoStream) {
        throw new Error('No se pudo obtener el stream de video');
      }

      videoEl.srcObject = this.videoStream;
      videoEl.muted = true; 

      await new Promise<void>((resolve, reject) => {
        // ... (Lógica de espera y play del video - sin cambios) ...
        if (this.destroyed) { reject(new Error('Componente destruido')); return; }

        const onMetadata = () => {
          if (this.destroyed) { cleanup(); reject(new Error('Componente destruido')); return; }
          videoEl.play().then(resolve).catch(reject);
        };
        const cleanup = () => { videoEl.removeEventListener('loadedmetadata', onMetadata); };
        videoEl.addEventListener('loadedmetadata', onMetadata, { once: true });
        
        if (videoEl.readyState >= 1) onMetadata();
      });

      if (!this.destroyed) {
        this.isLoading = false;
        this.cdr.detectChanges();
      }

    } catch (error: any) {
      if (!this.destroyed) {
        console.error('❌ Error al iniciar cámara:', error);
        // Si hay error, detenemos la carga y mostramos el mensaje, permitiendo la carga de archivos
        this.errorMessage = error?.message || 'Error desconocido';
        this.isLoading = false;
        this.videoStream = null; // Detenemos el stream si falló
        this.cameraService.stopCamera(); 
        this.cdr.detectChanges();
      }
    } finally {
      this.initializationInProgress = false;
    }
  }

  ngOnDestroy() {
    console.log('🛑 ngOnDestroy - Deteniendo cámara');
    this.destroyed = true;
    this.cameraService.stopCamera();
    this.videoStream = null;
  }

  capture() {
    if (!this.videoStream || this.destroyed) {
      console.error('No se puede capturar - stream no disponible o componente destruido');
      return;
    }

    const photo = this.cameraService.capturePhoto();
    this.processPhoto(photo);
  }

  /**
   * Maneja el archivo seleccionado por el usuario y lo convierte a Base64.
   * @param event Evento de cambio del input de archivo.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.processPhoto(e.target.result as string);
      };

      reader.onerror = (e) => {
        console.error('Error al leer el archivo:', e);
        this.errorMessage = 'Error al cargar el archivo de imagen.';
        this.isLoading = false;
        this.cdr.detectChanges();
      };
      
      reader.readAsDataURL(file);
      
      // Limpiar el input para permitir cargar el mismo archivo de nuevo
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  /**
   * Navega a la vista previa con la foto (ya sea capturada o cargada).
   * @param photo Base64 de la imagen.
   */
  private processPhoto(photo: string | null) {
    if (photo) {
      console.log('📸 Imagen lista para procesar');
      this.router.navigate(['/camera/preview'], {
        state: { photo }
      });
    } else {
      console.error('Error al procesar la imagen (null)');
      this.errorMessage = 'No se pudo obtener la imagen.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}