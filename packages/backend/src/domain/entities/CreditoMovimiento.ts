import { Monto } from '@fonevi/shared';
import { DomainError } from '../errors.js';

export interface CreditoMovimientoProps {
  id?: string;
  creditoId: string;
  tipo: 'desembolso' | 'pago_cuota' | 'reversion' | 'aprobacion' | 'cancelacion';
  monto: Monto;
  montoCapital?: Monto | null;
  montoInteres?: Monto | null;
  seguro?: Monto | null;
  saldoCapitalAnterior: Monto;
  saldoCapitalPosterior: Monto;
  descripcion?: string | null;
  createdAt?: Date;
}

export class CreditoMovimiento {
  readonly id: string;
  readonly creditoId: string;
  readonly tipo: string;
  readonly monto: Monto;
  readonly montoCapital?: Monto;
  readonly montoInteres?: Monto;
  readonly seguro?: Monto;
  readonly saldoCapitalAnterior: Monto;
  readonly saldoCapitalPosterior: Monto;
  readonly descripcion?: string;
  readonly createdAt: Date;

  private constructor(props: CreditoMovimientoProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.creditoId = props.creditoId;
    this.tipo = props.tipo;
    this.monto = props.monto;
    if (props.montoCapital) this.montoCapital = props.montoCapital;
    if (props.montoInteres) this.montoInteres = props.montoInteres;
    if (props.seguro) this.seguro = props.seguro;
    this.saldoCapitalAnterior = props.saldoCapitalAnterior;
    this.saldoCapitalPosterior = props.saldoCapitalPosterior;
    if (props.descripcion) this.descripcion = props.descripcion;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: CreditoMovimientoProps): CreditoMovimiento {
    if (!props.creditoId) throw new DomainError('creditoId es requerido');
    if (!props.monto || props.monto.value < 0) {
      throw new DomainError('El monto debe ser mayor o igual a 0');
    }
    const tipos = ['desembolso', 'pago_cuota', 'reversion', 'aprobacion', 'cancelacion'] as const;
    if (!tipos.includes(props.tipo)) {
      throw new DomainError(`Tipo de movimiento inválido: ${props.tipo}`);
    }
    return new CreditoMovimiento(props);
  }

  static fromPersistence(data: CreditoMovimientoProps): CreditoMovimiento {
    return new CreditoMovimiento(data);
  }
}
