import { ValueObjectError } from '../errors.js';

export type EstadoSocioType = 'activo' | 'mora' | 'retirado' | 'suspendido';

const ESTADOS_VALIDOS: EstadoSocioType[] = ['activo', 'mora', 'retirado', 'suspendido'];

export class EstadoSocio {
  private constructor(readonly value: EstadoSocioType) {}

  static create(value: string): EstadoSocio {
    const normalized = value.toLowerCase().trim() as EstadoSocioType;
    if (!ESTADOS_VALIDOS.includes(normalized)) {
      throw new ValueObjectError(
        `Estado de socio inválido: ${value}. Valores válidos: ${ESTADOS_VALIDOS.join(', ')}`,
      );
    }
    return new EstadoSocio(normalized);
  }

  static ACTIVO = new EstadoSocio('activo');
  static MORA = new EstadoSocio('mora');
  static RETIRADO = new EstadoSocio('retirado');
  static SUSPENDIDO = new EstadoSocio('suspendido');

  esActivo(): boolean {
    return this.value === 'activo';
  }

  puedeSolicitarCredito(): boolean {
    return this.value === 'activo';
  }

  equals(other: EstadoSocio): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
