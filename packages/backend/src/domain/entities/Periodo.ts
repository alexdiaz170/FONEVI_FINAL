import { DomainError } from '../errors.js';

export interface PeriodoProps {
  id?: number;
  nombre: string;
  anio: number;
  mes: number;
  activo?: boolean;
  createdAt?: Date;
}

export class Periodo {
  readonly id: number;
  readonly nombre: string;
  readonly anio: number;
  readonly mes: number;
  readonly activo: boolean;
  readonly createdAt: Date;

  private constructor(props: PeriodoProps) {
    this.id = props.id ?? 0;
    this.nombre = props.nombre;
    this.anio = props.anio;
    this.mes = props.mes;
    this.activo = props.activo ?? false;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: PeriodoProps): Periodo {
    if (!props.nombre || props.nombre.trim().length < 3) {
      throw new DomainError('El nombre del periodo debe tener al menos 3 caracteres');
    }
    if (props.mes < 1 || props.mes > 12) {
      throw new DomainError('El mes debe estar entre 1 y 12');
    }
    if (props.anio < 2000 || props.anio > 2100) {
      throw new DomainError('Año inválido');
    }
    return new Periodo(props);
  }

  static fromPersistence(data: PeriodoProps): Periodo {
    return new Periodo(data);
  }

  activar(): Periodo {
    return this.activo ? this : new Periodo({ ...this, activo: true });
  }

  desactivar(): Periodo {
    return this.activo ? new Periodo({ ...this, activo: false }) : this;
  }
}
