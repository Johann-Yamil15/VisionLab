import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

async function iniciar() {
  // Solo en desarrollo: ?vr=emulador simula un Quest 2 (IWER, de Meta) para probar la VR sin lentes.
  if (!environment.production && new URLSearchParams(location.search).get('vr') === 'emulador') {
    const iwer = 'https://unpkg.com/iwer@2.8.0/build/iwer.module.js';
    const { XRDevice, metaQuest2 } = await import(/* @vite-ignore */ iwer);
    const dispositivo = new XRDevice(metaQuest2);
    dispositivo.installRuntime({ forceInstall: true }); // el navegador ya trae su propio WebXR (sin visor)
    (window as unknown as { xrDevice: unknown }).xrDevice = dispositivo; // para moverlo desde la consola
  }
  await bootstrapApplication(App, appConfig);
}

iniciar().catch((err) => console.error(err));
