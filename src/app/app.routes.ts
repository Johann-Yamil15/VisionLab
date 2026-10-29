import { Routes } from '@angular/router';

/** Cada feature se carga bajo demanda (lazy loading). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'microscopio' },
  {
    path: 'microscopio',
    title: 'Microscopio · VisionLab',
    loadComponent: () => import('./features/microscope/microscope.page').then((m) => m.MicroscopePage),
  },
  {
    path: 'microscopio/vista-previa',
    title: 'Vista previa · VisionLab',
    loadComponent: () => import('./features/microscope/preview.page').then((m) => m.PreviewPage),
  },
  {
    path: 'descubrimiento',
    title: '¡Descubrimiento! · VisionLab',
    loadComponent: () => import('./features/discovery/discovery.page').then((m) => m.DiscoveryPage),
  },
  {
    path: 'almanaque',
    title: 'Mi almanaque · VisionLab',
    loadComponent: () => import('./features/almanac/almanac.page').then((m) => m.AlmanacPage),
  },
  {
    path: 'almanaque/:id',
    title: 'Tarjeta · VisionLab',
    loadComponent: () => import('./features/almanac/almanac-detail.page').then((m) => m.AlmanacDetailPage),
  },
  {
    path: 'perfil',
    title: 'Mi perfil · VisionLab',
    loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'acerca',
    title: 'Acerca de · VisionLab',
    loadComponent: () => import('./features/info/about.page').then((m) => m.AboutPage),
  },
  { path: '**', redirectTo: 'microscopio' },
];
