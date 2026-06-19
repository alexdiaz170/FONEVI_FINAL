import { Monto } from '@fonevi/shared';
import { EstadoAporte } from '../value-objects/EstadoAporte.js';
import { DomainError } from '../errors.js';

export interface AporteProps {
  id?: string;
  socioId: string;
  periodoId: number;
  monto: Monto;
  fechaPago?: Date | null;
  estado: EstadoAporte;
  metodo?: string | null;
  notas?: string | null;
  pagoSolidaridad?: Monto;
  pagoCredito?: Monto;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Aporte {
  readonly id: string;
  readonly socioId: string;
  readonly periodoId: number;
  readonly monto: Monto;
  readonly fechaPago: Date | null;
  readonly estado: EstadoAporte;
  readonly metodo: string | null;
  readonly notas: string | null;
  readonly pagoSolidaridad: Monto;
  readonly pagoCredito: Monto;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: AporteProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.socioId = props.socioId;
    this.periodoId = props.periodoId;
    this.monto = props.monto;
    this.fechaPago = props.fechaPago ?? null;
    this.estado = props.estado;
    this.metodo = props.metodo ?? null;
    this.notas = props.notas ?? null;
    this.pagoSolidaridad = props.pagoSolidaridad ?? Monto.create(0);
    this.pagoCredito = props.pagoCredito ?? Monto.create(0);
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: AporteProps): Aporte {
    if (!props.socioId) throw new DomainError('socioId es requerido');
    if (!props.periodoId) throw new DomainError('periodoId es requerido');
    if (!props.monto || props.monto.value <= 0) {
      throw new DomainError('El monto debe ser mayor a 0');
    }
    return new Aporte(props);
  }

  static fromPersistence(data: AporteProps): Aporte {
    return new Aporte(data);
  }

  get montoAhorro(): Monto {
    const usado = this.pagoSolidaridad.sumar(this.pagoCredito);
    return this.monto.restar(usado);
  }

  actualizarEstado(nuevoEstado: EstadoAporte): Aporte {
    return new Aporte({ ...this, estado: nuevoEstado });
  }

  actualizarDatos(
    datos: Partial<Pick<AporteProps, 'monto' | 'fechaPago' | 'estado' | 'metodo' | 'notas'>>,
  ): Aporte {
    return new Aporte({ ...this, ...datos });
  }
}
