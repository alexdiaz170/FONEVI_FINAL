import { Monto } from '@fonevi/shared';
import { TasaInteres } from '../value-objects/TasaInteres.js';
import { EstadoCredito, EstadoCreditoType } from '../value-objects/EstadoCredito.js';
import { DomainError } from '../errors.js';

export interface CreditoProps {
  id?: string;
  socioId: string;
  monto: Monto;
  tasaMensual: TasaInteres;
  cuotas: number;
  cuotasPagadas?: number;
  saldoCapital: Monto;
  fechaDesembolso: Date;
  fechaUltimoPago?: Date | null;
  estado?: EstadoCredito;
  proposito?: string | null;
  aprobadoPor?: string | null;
  notas?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Credito {
  readonly id: string;
  readonly socioId: string;
  readonly monto: Monto;
  readonly tasaMensual: TasaInteres;
  readonly cuotas: number;
  readonly cuotasPagadas: number;
  readonly saldoCapital: Monto;
  readonly fechaDesembolso: Date;
  readonly fechaUltimoPago: Date | null;
  readonly estado: EstadoCredito;
  readonly proposito: string | null;
  readonly aprobadoPor: string | null;
  readonly notas: string | null;
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: CreditoProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.socioId = props.socioId;
    this.monto = props.monto;
    this.tasaMensual = props.tasaMensual;
    this.cuotas = props.cuotas;
    this.cuotasPagadas = props.cuotasPagadas ?? 0;
    this.saldoCapital = props.saldoCapital;
    this.fechaDesembolso = props.fechaDesembolso;
    this.fechaUltimoPago = props.fechaUltimoPago ?? null;
    this.estado = props.estado ?? EstadoCredito.PENDIENTE;
    this.proposito = props.proposito ?? null;
    this.aprobadoPor = props.aprobadoPor ?? null;
    this.notas = props.notas ?? null;
    this.deletedAt = props.deletedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: CreditoProps): Credito {
    if (!props.socioId) throw new DomainError('socioId es requerido');
    if (!props.monto || props.monto.value <= 0) {
      throw new DomainError('El monto del crédito debe ser mayor a 0');
    }
    if (!props.cuotas || props.cuotas < 1) {
      throw new DomainError('El número de cuotas debe ser al menos 1');
    }
    return new Credito(props);
  }

  static fromPersistence(data: CreditoProps): Credito {
    return new Credito(data);
  }

  get cuotasRestantes(): number {
    return this.cuotas - this.cuotasPagadas;
  }

  get estaPagado(): boolean {
    return this.estado.esPagado() || this.saldoCapital.value <= 0;
  }

  get cuotaMensual(): Monto {
    if (this.cuotas === 0) return Monto.create(0);
    const r = this.tasaMensual.tasaDecimal;
    const n = this.cuotas;
    const p = this.monto.value;
    if (r === 0) return Monto.create(p / n);
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Monto.create(Math.round(p * factor * 100) / 100);
  }

  esActivo(): boolean {
    return this.estado.esActivo() && this.deletedAt === null;
  }

  esPendiente(): boolean {
    return this.estado.esPendiente() && this.deletedAt === null;
  }

  estaEliminado(): boolean {
    return this.deletedAt !== null;
  }

  registrarPagoCuota(montoCapital: Monto, montoInteres: Monto, fechaPago?: Date): Credito {
    const nuevasPagadas = this.cuotasPagadas + 1;
    const nuevoSaldo = this.saldoCapital.restar(montoCapital);
    const nuevoEstado =
      nuevasPagadas >= this.cuotas || nuevoSaldo.value <= 0
        ? EstadoCredito.PAGADO
        : EstadoCredito.ACTIVO;
    return new Credito({
      ...this.toProps(),
      cuotasPagadas: nuevasPagadas,
      saldoCapital: Monto.create(Math.max(0, nuevoSaldo.value)),
      estado: nuevoEstado,
      fechaUltimoPago: fechaPago ?? new Date(),
    });
  }

  aprobar(aprobadoPor: string): Credito {
    if (!this.estado.esPendiente()) {
      throw new DomainError('Solo se pueden aprobar créditos en estado pendiente');
    }
    return new Credito({
      ...this.toProps(),
      estado: EstadoCredito.ACTIVO,
      aprobadoPor,
    });
  }

  cancelar(): Credito {
    return new Credito({
      ...this.toProps(),
      estado: EstadoCredito.CANCELADO,
      deletedAt: new Date(),
    });
  }

  actualizarDatos(
    datos: Partial<Pick<CreditoProps, 'proposito' | 'aprobadoPor' | 'notas'>>,
  ): Credito {
    return new Credito({ ...this.toProps(), ...datos });
  }

  toProps(): CreditoProps {
    return {
      id: this.id,
      socioId: this.socioId,
      monto: this.monto,
      tasaMensual: this.tasaMensual,
      cuotas: this.cuotas,
      cuotasPagadas: this.cuotasPagadas,
      saldoCapital: this.saldoCapital,
      fechaDesembolso: this.fechaDesembolso,
      fechaUltimoPago: this.fechaUltimoPago,
      estado: this.estado,
      proposito: this.proposito,
      aprobadoPor: this.aprobadoPor,
      notas: this.notas,
      deletedAt: this.deletedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
