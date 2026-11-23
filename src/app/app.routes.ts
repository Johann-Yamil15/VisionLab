import { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './core/auth/auth.guard';

/** Cada feature se carga bajo demanda (lazy loading). Requiere sesión todo lo que guarda o lee datos del usuario. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'microscopio' },
  {
    path: 'login',
    title: 'Iniciar sesión · OmniScan',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro',
    title: 'Crear cuenta · OmniScan',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'microscopio',
    canActivate: [authGuard],
    title: 'Microscopio · OmniScan',
    loadComponent: () => import('./features/microscope/microscope.page').then((m) => m.MicroscopePage),
  },
  {
    path: 'microscopio/vista-previa',
    canActivate: [authGuard],
    title: 'Vista previa · OmniScan',
    loadComponent: () => import('./features/microscope/preview.page').then((m) => m.PreviewPage),
  },
  {
    path: 'descubrimiento',
    canActivate: [authGuard],
    title: '¡Descubrimiento! · OmniScan',
    loadComponent: () => import('./features/discovery/discovery.page').then((m) => m.DiscoveryPage),
  },
  {
    path: 'almanaque',
    canActivate: [authGuard],
    title: 'Mi almanaque · OmniScan',
    loadComponent: () => import('./features/almanac/almanac.page').then((m) => m.AlmanacPage),
  },
  {
    path: 'almanaque/:id',
    canActivate: [authGuard],
    title: 'Tarjeta · OmniScan',
    loadComponent: () => import('./features/almanac/almanac-detail.page').then((m) => m.AlmanacDetailPage),
  },
  {
    path: 'atlas',
    title: 'Atlas Vivo 3D · OmniScan',
    loadComponent: () => import('./features/atlas/atlas.page').then((m) => m.AtlasPage),
  },
  {
    path: 'atlas/:id',
    title: 'Explorar en 3D · OmniScan',
    loadComponent: () => import('./features/atlas/atlas-detail.page').then((m) => m.AtlasDetailPage),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
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
