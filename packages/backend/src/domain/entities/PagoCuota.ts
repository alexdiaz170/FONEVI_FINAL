import { Monto } from '@fonevi/shared';
import { DomainError } from '../errors.js';

export interface PagoCuotaProps {
  id?: string;
  creditoId: string;
  numeroCuota: number;
  monto: Monto;
  montoCapital: Monto;
  montoInteres: Monto;
  fechaPago: Date;
  createdAt?: Date;
}

export class PagoCuota {
  readonly id: string;
  readonly creditoId: string;
  readonly numeroCuota: number;
  readonly monto: Monto;
  readonly montoCapital: Monto;
  readonly montoInteres: Monto;
  readonly fechaPago: Date;
  readonly createdAt: Date;

  private constructor(props: PagoCuotaProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.creditoId = props.creditoId;
    this.numeroCuota = props.numeroCuota;
    this.monto = props.monto;
    this.montoCapital = props.montoCapital;
    this.montoInteres = props.montoInteres;
    this.fechaPago = props.fechaPago;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: PagoCuotaProps): PagoCuota {
    if (!props.creditoId) throw new DomainError('creditoId es requerido');
    if (!props.numeroCuota || props.numeroCuota < 1) {
      throw new DomainError('El número de cuota debe ser al menos 1');
    }
    if (!props.monto || props.monto.value <= 0) {
      throw new DomainError('El monto de la cuota debe ser mayor a 0');
    }
    return new PagoCuota(props);
  }

  static fromPersistence(data: PagoCuotaProps): PagoCuota {
    return new PagoCuota(data);
  }
}
