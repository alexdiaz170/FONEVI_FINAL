import { Monto } from '@fonevi/shared';
import { DomainError } from '../errors.js';

export interface DividendoSocioProps {
  id?: string;
  dividendoId: string;
  socioId: string;
  monto: Monto;
  pagado?: boolean;
  fechaPago?: Date | null;
  createdAt?: Date;
}

export class DividendoSocio {
  readonly id: string;
  readonly dividendoId: string;
  readonly socioId: string;
  readonly monto: Monto;
  readonly pagado: boolean;
  readonly fechaPago: Date | null;
  readonly createdAt: Date;

  private constructor(props: DividendoSocioProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.dividendoId = props.dividendoId;
    this.socioId = props.socioId;
    this.monto = props.monto;
    this.pagado = props.pagado ?? false;
    this.fechaPago = props.fechaPago ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: DividendoSocioProps): DividendoSocio {
    if (!props.dividendoId) throw new DomainError('dividendoId es requerido');
    if (!props.socioId) throw new DomainError('socioId es requerido');
    if (!props.monto || props.monto.value <= 0)
      throw new DomainError('El monto debe ser mayor a 0');
    return new DividendoSocio(props);
  }

  static fromPersistence(data: DividendoSocioProps): DividendoSocio {
    return new DividendoSocio(data);
  }

  marcarPagado(fechaPago?: Date): DividendoSocio {
    return new DividendoSocio({ ...this, pagado: true, fechaPago: fechaPago ?? new Date() });
  }
}
