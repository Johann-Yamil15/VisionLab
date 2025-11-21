import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// // --- Core / Auth Guard ---
// import { AuthGuard } from './Core/guards/auth.guard';

// --- Features ---
import { CameraComponent } from './features/camera/camera.component';
import { PreviewComponent } from './features/camera/preview.component';
import { ResultsComponent } from './features/camera/results.component';
import { ChatComponent } from './features/chat/chat.component'; // 🟢 AÑADIDO: ChatComponent
import { AnalysisViewComponent } from './features/camera/analysis-view.component'; // 🟢 AÑADIDO: Vista Contenedora
// import { ChatComponent } from './features/chat/chat.component';

// import { AlmanacListComponent } from './features/almanac/almanac-list.component';
// import { AlmanacDetailComponent } from './features/almanac/almanac-detail.component';

// import { AchievementsComponent } from './features/gamification/achievements.component';
// import { LevelsComponent } from './features/gamification/levels.component';

// // --- Settings ---
// import { SettingsComponent } from './settings/settings.component';
// import { ThemeToggleComponent } from './settings/theme-toggle.component';
// import { LegalComponent } from './settings/legal.component';

// // --- Auth ---
// import { LoginComponent } from './auth/login.component';
// import { RegisterComponent } from './auth/register.component';

export const routes: Routes = [
//   // --- Auth ---
//   { path: 'login', component: LoginComponent },
//   { path: 'register', component: RegisterComponent },

  // // --- Camera ---
  // { path: 'camera', component: CameraComponent, canActivate: [AuthGuard] },
  // { path: 'camera/preview', component: PreviewComponent, canActivate: [AuthGuard] },
  // { path: 'camera/results', component: ResultsComponent, canActivate: [AuthGuard] },
  // --- Camera ---
{ path: 'camera', component: CameraComponent },
{ path: 'camera/preview', component: PreviewComponent },
// 🟢 RUTA DE ANÁLISIS MEJORADA (Destino final del flujo)
    // Usamos 'analysis' para englobar tanto los resultados como el chat.
    { path: 'analysis', component: AnalysisViewComponent }, 
    
    // Si quieres acceder a Results solo:
    // { path: 'camera/results', component: ResultsComponent }, 

    // Si quieres acceder a Chat solo:
    { path: 'chat', component: ChatComponent },


//   // --- Chat ---
//   { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },

//   // --- Almanac ---
//   { path: 'almanac', component: AlmanacListComponent, canActivate: [AuthGuard] },
//   { path: 'almanac/:id', component: AlmanacDetailComponent, canActivate: [AuthGuard] },

//   // --- Gamification ---
//   { path: 'achievements', component: AchievementsComponent, canActivate: [AuthGuard] },
//   { path: 'levels', component: LevelsComponent, canActivate: [AuthGuard] },

//   // --- Settings ---
//   { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
//   { path: 'theme', component: ThemeToggleComponent, canActivate: [AuthGuard] },
//   { path: 'legal', component: LegalComponent, canActivate: [AuthGuard] },

  // --- Default & wildcard ---
  { path: '', redirectTo: '/camera', pathMatch: 'full' },
  { path: '**', redirectTo: '/camera' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
