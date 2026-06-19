import { ValueObjectError } from '../errors.js';

export type EstadoAporteType = 'pendiente' | 'pagado' | 'mora' | 'vencido' | 'anulado';

const ESTADOS_VALIDOS: EstadoAporteType[] = ['pendiente', 'pagado', 'mora', 'vencido', 'anulado'];

export class EstadoAporte {
  private constructor(readonly value: EstadoAporteType) {}

  static create(value: string): EstadoAporte {
    const normalized = value.toLowerCase().trim() as EstadoAporteType;
    if (!ESTADOS_VALIDOS.includes(normalized)) {
      throw new ValueObjectError(
        `Estado de aporte inválido: ${value}. Valores válidos: ${ESTADOS_VALIDOS.join(', ')}`,
      );
    }
    return new EstadoAporte(normalized);
  }

  static PENDIENTE = new EstadoAporte('pendiente');
  static PAGADO = new EstadoAporte('pagado');
  static MORA = new EstadoAporte('mora');
  static VENCIDO = new EstadoAporte('vencido');
  static ANULADO = new EstadoAporte('anulado');

  esPagado(): boolean {
    return this.value === 'pagado';
  }

  esMoraOVencido(): boolean {
    return this.value === 'mora' || this.value === 'vencido';
  }

  equals(other: EstadoAporte): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
