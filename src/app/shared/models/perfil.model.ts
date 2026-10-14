export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  requisitoValor: number;
  requisitoTipo: string;
  puntosOtorgados: number;
}

/** GET /api/usuarios */
export interface Perfil {
  id: string;
  nombreUsuario: string;
  puntos: number;
  hallazgosContador: number;
  nivelActual: string;
  logros: Logro[];
}
