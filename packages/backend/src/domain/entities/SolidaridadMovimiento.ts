import { Monto } from '@fonevi/shared';
import { DomainError } from '../errors.js';

export interface SolidaridadMovimientoProps {
  id?: string;
  tipo: string;
  descripcion: string;
  monto: Monto;
  fecha: Date;
  beneficiario?: string | null;
  createdAt?: Date;
}

export class SolidaridadMovimiento {
  readonly id: string;
  readonly tipo: string;
  readonly descripcion: string;
  readonly monto: Monto;
  readonly fecha: Date;
  readonly beneficiario: string | null;
  readonly createdAt: Date;

  private constructor(props: SolidaridadMovimientoProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.tipo = props.tipo;
    this.descripcion = props.descripcion;
    this.monto = props.monto;
    this.fecha = props.fecha;
    this.beneficiario = props.beneficiario ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: SolidaridadMovimientoProps): SolidaridadMovimiento {
    if (!['ingreso', 'egreso'].includes(props.tipo)) {
      throw new DomainError('El tipo debe ser "ingreso" o "egreso"');
    }
    if (!props.descripcion || props.descripcion.trim().length < 3) {
      throw new DomainError('La descripción debe tener al menos 3 caracteres');
    }
    if (!props.monto || props.monto.value <= 0) {
      throw new DomainError('El monto debe ser mayor a 0');
    }
    return new SolidaridadMovimiento(props);
  }

  static fromPersistence(data: SolidaridadMovimientoProps): SolidaridadMovimiento {
    return new SolidaridadMovimiento(data);
  }

  esIngreso(): boolean {
    return this.tipo === 'ingreso';
  }

  esEgreso(): boolean {
    return this.tipo === 'egreso';
  }
}
