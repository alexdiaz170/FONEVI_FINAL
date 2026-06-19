import { ValueObjectError } from '../errors.js';

export class TasaInteres {
  private constructor(readonly value: number) {}

  static create(value: number): TasaInteres {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValueObjectError('La tasa de interés debe ser un número válido');
    }
    if (value <= 0 || value > 100) {
      throw new ValueObjectError('La tasa de interés debe estar entre 0 y 100');
    }
    return new TasaInteres(value);
  }

  get tasaDecimal(): number {
    return this.value / 100;
  }

  equals(other: TasaInteres): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return `${this.value}%`;
  }
}
