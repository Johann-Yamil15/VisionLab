import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_URL } from '../api/api';
import { authGuard, invitadoGuard } from './auth.guard';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

const SESION = { token: 'jwt-de-prueba', usuario: { id: '1', nombreUsuario: 'Luna', email: 'l@t.mx', puntos: 0, nivel: 1 } };

describe('Autenticación', () => {
  beforeEach(() => {
    localStorage.removeItem('visionlab.sesion');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });

  afterEach(() => localStorage.removeItem('visionlab.sesion'));

  it('iniciarSesion guarda la sesión y la restaura al recargar', () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    auth.iniciarSesion('l@t.mx', 'secreto1').subscribe();
    const req = http.expectOne(`${API_URL}/auth/login`);
    expect(req.request.body).toEqual({ email: 'l@t.mx', contraseña: 'secreto1' });
    req.flush(SESION);

    expect(auth.autenticado()).toBeTrue();
    expect(auth.token).toBe('jwt-de-prueba');
    expect(JSON.parse(localStorage.getItem('visionlab.sesion')!).token).toBe('jwt-de-prueba');
  });

  it('el interceptor agrega el token solo a las peticiones del API', () => {
    localStorage.setItem('visionlab.sesion', JSON.stringify(SESION));
    const http = TestBed.inject(HttpTestingController);
    const cliente = TestBed.inject(HttpClient);

    cliente.get(`${API_URL}/hallazgos`).subscribe();
    cliente.get('https://otro-sitio.test/x').subscribe();

    expect(http.expectOne(`${API_URL}/hallazgos`).request.headers.get('Authorization')).toBe('Bearer jwt-de-prueba');
    expect(http.expectOne('https://otro-sitio.test/x').request.headers.has('Authorization')).toBeFalse();
  });

  it('si el API responde 401 con sesión, la cierra', () => {
    localStorage.setItem('visionlab.sesion', JSON.stringify(SESION));
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    TestBed.inject(HttpClient).get(`${API_URL}/usuarios`).subscribe({ error: () => undefined });
    http.expectOne(`${API_URL}/usuarios`).flush('', { status: 401, statusText: 'Unauthorized' });

    expect(auth.autenticado()).toBeFalse();
    expect(localStorage.getItem('visionlab.sesion')).toBeNull();
  });

  it('los guards mandan a /login sin sesión y a /microscopio con sesión', () => {
    const router = TestBed.inject(Router);
    const auth = TestBed.inject(AuthService);
    const ejecutar = (guard: typeof authGuard) =>
      TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(router.serializeUrl(ejecutar(authGuard) as never)).toBe('/login');
    expect(ejecutar(invitadoGuard)).toBeTrue();

    localStorage.setItem('visionlab.sesion', JSON.stringify(SESION));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(
      TestBed.runInInjectionContext(() => invitadoGuard({} as never, {} as never)) as never)).toBe('/microscopio');
    expect(auth).toBeTruthy();
  });
});
