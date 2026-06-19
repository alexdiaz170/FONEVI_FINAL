export class Monto {
  private constructor(private readonly _valor: number) {
    if (!Number.isFinite(_valor)) {
      throw new Error('Monto inválido: debe ser un número finito');
    }
    if (_valor < 0) {
      throw new Error(`Monto inválido: no puede ser negativo (${_valor})`);
    }
  }

  static create(valor: number): Monto {
    return new Monto(valor);
  }

  get value(): number {
    return this._valor;
  }

  sumar(otro: Monto): Monto {
    return new Monto(this._valor + otro._valor);
  }

  restar(otro: Monto): Monto {
    return new Monto(this._valor - otro._valor);
  }

  multiplicar(por: number): Monto {
    return new Monto(this._valor * por);
  }

  esMayorQue(otro: Monto): boolean {
    return this._valor > otro._valor;
  }

  esMenorQue(otro: Monto): boolean {
    return this._valor < otro._valor;
  }

  equals(other: Monto): boolean {
    return this._valor === other._valor;
  }

  toString(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(this._valor);
  }
}
