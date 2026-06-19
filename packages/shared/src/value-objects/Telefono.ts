export class Telefono {
  private static readonly MIN_DIGITOS = 7;
  private static readonly MAX_DIGITOS = 10;

  private constructor(readonly value: string) {
    const digitos = value.replace(/\D/g, '');
    if (digitos.length < Telefono.MIN_DIGITOS || digitos.length > Telefono.MAX_DIGITOS) {
      throw new Error(
        `Teléfono inválido: debe tener entre ${Telefono.MIN_DIGITOS} y ${Telefono.MAX_DIGITOS} dígitos`,
      );
    }
  }

  static create(value: string): Telefono {
    return new Telefono(value.trim());
  }

  get digits(): string {
    return this.value.replace(/\D/g, '');
  }

  get formatoInternacional(): string {
    return `+57${this.digits}`;
  }

  equals(other: Telefono): boolean {
    return this.digits === other.digits;
  }

  toString(): string {
    return this.value;
  }
}
