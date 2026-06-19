import { Monto } from '@fonevi/shared';
import { DomainError } from '../errors.js';

export interface DividendoProps {
  id?: string;
  periodo: string;
  montoTotal: Monto;
  distribuido?: boolean;
  fechaCalculo: Date;
  fechaPago?: Date | null;
  createdAt?: Date;
}

export class Dividendo {
  readonly id: string;
  readonly periodo: string;
  readonly montoTotal: Monto;
  readonly distribuido: boolean;
  readonly fechaCalculo: Date;
  readonly fechaPago: Date | null;
  readonly createdAt: Date;

  private constructor(props: DividendoProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.periodo = props.periodo;
    this.montoTotal = props.montoTotal;
    this.distribuido = props.distribuido ?? false;
    this.fechaCalculo = props.fechaCalculo;
    this.fechaPago = props.fechaPago ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: DividendoProps): Dividendo {
    if (!props.periodo) throw new DomainError('El período es requerido');
    if (!props.montoTotal || props.montoTotal.value <= 0)
      throw new DomainError('El monto total debe ser mayor a 0');
    return new Dividendo(props);
  }

  static fromPersistence(data: DividendoProps): Dividendo {
    return new Dividendo(data);
  }
}
