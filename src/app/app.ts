import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  HostListener,
  effect,
  PLATFORM_ID,
  inject
} from '@angular/core';

import {
  CommonModule,
  NgClass,
  isPlatformBrowser
} from '@angular/common';

import {
  RouterOutlet,
  RouterModule,
  RouterLink,
  RouterLinkActive,
  Router
} from '@angular/router';

// ✨ IMPORTAR EL COMPONENTE DE ACCESIBILIDAD
import { AccesibilidadComponent } from './accesibilidad/accesibilidad.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgClass,
    RouterOutlet,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    AccesibilidadComponent  // ✨ AGREGAR AQUÍ
  ]
})
export class App {
  
  // ============================================
  // 🎯 SIGNALS (Estado Reactivo)
  // ============================================
  
  // Detectar si estamos en el navegador
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  // Estado del sidebar
  isSidebarOpen = signal(false);
  isSidebarCollapsed = signal(false);
  
  // Estado del menú de perfil
  isProfileMenuOpen = signal(false);
  
  // Estado de autenticación
  isLoggedIn = signal(false);
  currentUser = signal({
    name: 'Usuario Demo',
    email: 'demo@visionlab.com'
  });

  // Detectar tamaño de pantalla
  private windowWidth = signal(0);
  
  // Computed: Es móvil si ancho < 768px
  isMobile = computed(() => this.windowWidth() < 768);

  constructor(private router: Router) {
    // Inicializar ancho de ventana solo en el navegador
    if (this.isBrowser) {
      this.windowWidth.set(window.innerWidth);
    }
    
    // Verificar autenticación al iniciar
    this.checkAuthStatus();

    // Effect: Ajustar sidebar cuando cambia el tamaño de pantalla
    effect(() => {
      const mobile = this.isMobile();
      
      if (!mobile && this.isSidebarOpen()) {
        // En desktop, cerrar el overlay del sidebar
        this.isSidebarOpen.set(false);
      }
    });
  }

  // ============================================
  // 📱 DETECCIÓN DE TAMAÑO DE PANTALLA
  // ============================================
  
  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) {
      this.windowWidth.set(window.innerWidth);
    }
  }

  // ============================================
  // 🎯 FUNCIONES DEL SIDEBAR
  // ============================================
  
  /**
   * Toggle del sidebar
   * Mobile: Abre/cierra overlay
   * Desktop: Colapsa/expande
   */
  toggleSidebar(): void {
    if (this.isMobile()) {
      this.isSidebarOpen.update(v => !v);
    } else {
      this.isSidebarCollapsed.update(v => !v);
    }
  }

  /**
   * Cierra el sidebar (solo mobile)
   */
  closeSidebar(): void {
    if (this.isMobile()) {
      this.isSidebarOpen.set(false);
    }
  }

  /**
   * Cierra el sidebar al hacer clic en un link de navegación
   */
  onNavLinkClick(): void {
    if (this.isMobile()) {
      this.closeSidebar();
    }
  }

  // ============================================
  // 👤 FUNCIONES DEL MENÚ DE PERFIL
  // ============================================
  
  /**
   * Toggle del menú desplegable de perfil
   */
  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update(v => !v);
  }

  /**
   * Cierra el menú de perfil al hacer clic fuera
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const profileContainer = target.closest('.profile-menu-container');
    
    if (!profileContainer && this.isProfileMenuOpen()) {
      this.isProfileMenuOpen.set(false);
    }
  }

  // ============================================
  // 🔐 FUNCIONES DE AUTENTICACIÓN
  // ============================================
  
  /**
   * Verifica el estado de autenticación
   * NOTA: Integrar con tu servicio de autenticación real
   */
  private checkAuthStatus(): void {
    // Solo acceder a localStorage en el navegador
    if (!this.isBrowser) return;
    
    // Simulación - reemplazar con tu AuthService
    const token = localStorage.getItem('authToken');
    this.isLoggedIn.set(!!token);
    
    if (this.isLoggedIn()) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          this.currentUser.set(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }

  /**
   * Navega a la página de login
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
    this.isProfileMenuOpen.set(false);
  }

  /**
   * Navega a la página de registro
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
    this.isProfileMenuOpen.set(false);
  }

  /**
   * Cierra sesión del usuario
   */
  logout(): void {
    // Solo acceder a localStorage en el navegador
    if (this.isBrowser) {
      // Limpiar datos de autenticación
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
    
    // Resetear estado
    this.isLoggedIn.set(false);
    this.currentUser.set({
      name: '',
      email: ''
    });
    this.isProfileMenuOpen.set(false);
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Navega al perfil del usuario
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.isProfileMenuOpen.set(false);
  }

  /**
   * Navega al dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
    this.isProfileMenuOpen.set(false);
  }

  // ============================================
  // 🎮 FUNCIONES AUXILIARES
  // ============================================
  
  /**
   * Obtiene las iniciales del usuario para el avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user.name) return 'U';
    
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  }

}