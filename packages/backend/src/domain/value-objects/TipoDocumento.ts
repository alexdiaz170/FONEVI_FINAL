import { ValueObjectError } from '../errors.js';

export type TipoDocumentoType = 'CC' | 'CE' | 'NIT' | 'PASAPORTE';

const TIPOS_VALIDOS: TipoDocumentoType[] = ['CC', 'CE', 'NIT', 'PASAPORTE'];

export class TipoDocumento {
  private constructor(readonly value: TipoDocumentoType) {}

  static create(value: string): TipoDocumento {
    const normalized = value.toUpperCase().trim() as TipoDocumentoType;
    if (!TIPOS_VALIDOS.includes(normalized)) {
      throw new ValueObjectError(
        `Tipo de documento inválido: ${value}. Valores válidos: ${TIPOS_VALIDOS.join(', ')}`,
      );
    }
    return new TipoDocumento(normalized);
  }

  static CC = new TipoDocumento('CC');
  static CE = new TipoDocumento('CE');
  static NIT = new TipoDocumento('NIT');
  static PASAPORTE = new TipoDocumento('PASAPORTE');

  equals(other: TipoDocumento): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
