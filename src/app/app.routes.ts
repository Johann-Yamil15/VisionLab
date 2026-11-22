import { Routes } from '@angular/router';

/** Cada feature se carga bajo demanda (lazy loading). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'microscopio' },
  {
    path: 'microscopio',
    title: 'Microscopio · OmniScan',
    loadComponent: () => import('./features/microscope/microscope.page').then((m) => m.MicroscopePage),
  },
  {
    path: 'microscopio/vista-previa',
    title: 'Vista previa · OmniScan',
    loadComponent: () => import('./features/microscope/preview.page').then((m) => m.PreviewPage),
  },
  {
    path: 'descubrimiento',
    title: '¡Descubrimiento! · OmniScan',
    loadComponent: () => import('./features/discovery/discovery.page').then((m) => m.DiscoveryPage),
  },
  {
    path: 'almanaque',
    title: 'Mi almanaque · OmniScan',
    loadComponent: () => import('./features/almanac/almanac.page').then((m) => m.AlmanacPage),
  },
  {
    path: 'almanaque/:id',
    title: 'Tarjeta · OmniScan',
    loadComponent: () => import('./features/almanac/almanac-detail.page').then((m) => m.AlmanacDetailPage),
  },
  {
    path: 'atlas',
    title: 'Atlas Vivo 3D · OmniScan',
    loadComponent: () => import('./features/atlas/atlas.page').then((m) => m.AtlasPage),
  },
  {
    path: 'perfil',
    title: 'Mi perfil · OmniScan',
    loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'acerca',
    title: 'Acerca de · OmniScan',
    loadComponent: () => import('./features/info/about.page').then((m) => m.AboutPage),
  },
  { path: '**', redirectTo: 'microscopio' },
];
