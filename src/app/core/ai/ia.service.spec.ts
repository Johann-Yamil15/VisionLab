import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../api/api';
import { DemoService } from './demo.service';
import { IaService } from './ia.service';

const ATLAS = [
  { id: 'jaguar', nombre: 'Jaguar', nombreCientifico: 'Panthera onca' },
  { id: 'amatista', nombre: 'Cuarzo amatista', nombreCientifico: '' },
];

describe('IaService.analyze', () => {
  let http: HttpTestingController;
  let ia: IaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DemoService, useValue: { activo: () => false } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    ia = TestBed.inject(IaService);
  });

  afterEach(() => http.verify());

  it('manda los nombres del Atlas junto con la foto', () => {
    let resultado: unknown;
    ia.analyze('data:image/jpeg;base64,AAAA').subscribe((r) => (resultado = r));

    http.expectOne('atlas3d/atlas.json').flush(ATLAS);
    const req = http.expectOne(`${API_URL}/analisis`);
    expect(req.request.body).toEqual({
      imagen: 'data:image/jpeg;base64,AAAA',
      catalogo: [
        { nombreComun: 'Jaguar', nombreCientifico: 'Panthera onca' },
        { nombreComun: 'Cuarzo amatista', nombreCientifico: '' },
      ],
    });
    req.flush({ tipo: 'Objetos', nombreComun: 'Jaguar', nivelConfianza: '96' });

    expect((resultado as { nivelConfianza: number }).nivelConfianza).toBe(96);
  });

  it('si el catálogo no carga, analiza igual sin él', () => {
    ia.analyze('data:image/jpeg;base64,AAAA').subscribe();

    http.expectOne('atlas3d/atlas.json').flush('', { status: 404, statusText: 'Not Found' });
    const req = http.expectOne(`${API_URL}/analisis`);
    expect(req.request.body.catalogo).toEqual([]);
    req.flush({ tipo: 'Objetos', nombreComun: 'x', nivelConfianza: 50 });
  });
});
