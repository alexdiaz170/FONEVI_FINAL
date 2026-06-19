import { Monto } from '@fonevi/shared';
import { DomainError } from '../errors.js';

export interface AcuerdoPagoProps {
  id?: string;
  socioId: string;
  montoTotal: Monto;
  cuotas: number;
  montoCuota: Monto;
  estado?: string;
  fechaInicio: Date;
  fechaFin?: Date | null;
  notas?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AcuerdoPago {
  readonly id: string;
  readonly socioId: string;
  readonly montoTotal: Monto;
  readonly cuotas: number;
  readonly montoCuota: Monto;
  readonly estado: string;
  readonly fechaInicio: Date;
  readonly fechaFin: Date | null;
  readonly notas: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: AcuerdoPagoProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.socioId = props.socioId;
    this.montoTotal = props.montoTotal;
    this.cuotas = props.cuotas;
    this.montoCuota = props.montoCuota;
    this.estado = props.estado ?? 'activo';
    this.fechaInicio = props.fechaInicio;
    this.fechaFin = props.fechaFin ?? null;
    this.notas = props.notas ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: AcuerdoPagoProps): AcuerdoPago {
    if (!props.socioId) throw new DomainError('socioId es requerido');
    if (!props.montoTotal || props.montoTotal.value <= 0)
      throw new DomainError('El monto total debe ser mayor a 0');
    if (!props.cuotas || props.cuotas < 1) throw new DomainError('Debe haber al menos 1 cuota');
    return new AcuerdoPago(props);
  }

  static fromPersistence(data: AcuerdoPagoProps): AcuerdoPago {
    return new AcuerdoPago(data);
  }

  cumplir(): AcuerdoPago {
    return new AcuerdoPago({ ...this, estado: 'cumplido', fechaFin: new Date() });
  }

  cancelar(): AcuerdoPago {
    return new AcuerdoPago({ ...this, estado: 'cancelado', fechaFin: new Date() });
  }
}
