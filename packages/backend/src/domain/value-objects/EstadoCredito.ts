import { ValueObjectError } from '../errors.js';

export type EstadoCreditoType = 'pendiente' | 'activo' | 'pagado' | 'cancelado';

const VALID_ESTADOS: EstadoCreditoType[] = ['pendiente', 'activo', 'pagado', 'cancelado'];

export class EstadoCredito {
  private constructor(readonly value: EstadoCreditoType) {}

  static PENDIENTE = new EstadoCredito('pendiente');
  static ACTIVO = new EstadoCredito('activo');
  static PAGADO = new EstadoCredito('pagado');
  static CANCELADO = new EstadoCredito('cancelado');

  static create(value: string): EstadoCredito {
    const normalized = value.toLowerCase().trim() as EstadoCreditoType;
    if (!VALID_ESTADOS.includes(normalized)) {
      throw new ValueObjectError(
        `Estado de crédito inválido: "${value}". Valores válidos: ${VALID_ESTADOS.join(', ')}`,
      );
    }
    return new EstadoCredito(normalized);
  }

  esPendiente(): boolean {
    return this.value === 'pendiente';
  }

  esActivo(): boolean {
    return this.value === 'activo';
  }

  esPagado(): boolean {
    return this.value === 'pagado';
  }

  esCancelado(): boolean {
    return this.value === 'cancelado';
  }

  equals(other: EstadoCredito): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
