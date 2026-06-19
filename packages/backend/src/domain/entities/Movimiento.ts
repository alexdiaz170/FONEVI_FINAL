import { Monto } from '@fonevi/shared';
import { DomainError } from '../errors.js';

export interface MovimientoProps {
  id?: string;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: Monto;
  fecha: Date;
  createdAt?: Date;
}

export class Movimiento {
  readonly id: string;
  readonly tipo: string;
  readonly categoria: string;
  readonly descripcion: string;
  readonly monto: Monto;
  readonly fecha: Date;
  readonly createdAt: Date;

  private constructor(props: MovimientoProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.tipo = props.tipo;
    this.categoria = props.categoria;
    this.descripcion = props.descripcion;
    this.monto = props.monto;
    this.fecha = props.fecha;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: MovimientoProps): Movimiento {
    if (!props.tipo || !['ingreso', 'egreso'].includes(props.tipo)) {
      throw new DomainError('El tipo debe ser "ingreso" o "egreso"');
    }
    if (!props.categoria || props.categoria.trim().length < 2) {
      throw new DomainError('La categoría debe tener al menos 2 caracteres');
    }
    if (!props.descripcion || props.descripcion.trim().length < 3) {
      throw new DomainError('La descripción debe tener al menos 3 caracteres');
    }
    if (!props.monto || props.monto.value <= 0) {
      throw new DomainError('El monto debe ser mayor a 0');
    }
    return new Movimiento(props);
  }

  static fromPersistence(data: MovimientoProps): Movimiento {
    return new Movimiento(data);
  }

  esIngreso(): boolean {
    return this.tipo === 'ingreso';
  }

  esEgreso(): boolean {
    return this.tipo === 'egreso';
  }
}
