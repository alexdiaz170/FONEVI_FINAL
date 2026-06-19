import { Email, Monto, Telefono } from '@fonevi/shared';
import { TipoDocumento } from '../value-objects/TipoDocumento.js';
import { EstadoSocio, EstadoSocioType } from '../value-objects/EstadoSocio.js';
import { DomainError } from '../errors.js';

export interface SocioProps {
  id?: string;
  codigo: string;
  codigoSocio?: string;
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  email?: Email | null;
  telefono?: Telefono | null;
  fechaIngreso: Date;
  aporteMensual: Monto;
  ahorroAcumulado?: Monto;
  estado: EstadoSocio;
  cargo?: string | null;
  sede?: string | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Socio {
  readonly id: string;
  readonly codigo: string;
  readonly codigoSocio: string | null;
  readonly nombre: string;
  readonly tipoDocumento: TipoDocumento;
  readonly numeroDocumento: string;
  readonly email: Email | null;
  readonly telefono: Telefono | null;
  readonly fechaIngreso: Date;
  readonly aporteMensual: Monto;
  readonly ahorroAcumulado: Monto;
  readonly estado: EstadoSocio;
  readonly cargo: string | null;
  readonly sede: string | null;
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: SocioProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.codigo = props.codigo;
    this.codigoSocio = props.codigoSocio ?? null;
    this.nombre = props.nombre;
    this.tipoDocumento = props.tipoDocumento;
    this.numeroDocumento = props.numeroDocumento;
    this.email = props.email ?? null;
    this.telefono = props.telefono ?? null;
    this.fechaIngreso = props.fechaIngreso;
    this.aporteMensual = props.aporteMensual;
    this.ahorroAcumulado = props.ahorroAcumulado ?? Monto.create(0);
    this.estado = props.estado;
    this.cargo = props.cargo ?? null;
    this.sede = props.sede ?? null;
    this.deletedAt = props.deletedAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: SocioProps): Socio {
    if (!props.nombre || props.nombre.trim().length < 2) {
      throw new DomainError('El nombre debe tener al menos 2 caracteres');
    }
    if (!props.codigo || props.codigo.trim().length < 2) {
      throw new DomainError('El código del socio es requerido');
    }
    if (!props.numeroDocumento || props.numeroDocumento.trim().length < 3) {
      throw new DomainError('El número de documento es requerido');
    }
    return new Socio(props);
  }

  static fromPersistence(data: SocioProps): Socio {
    return new Socio(data);
  }

  esActivo(): boolean {
    return this.estado.esActivo() && this.deletedAt === null;
  }

  puedeSolicitarCredito(): boolean {
    return this.estado.puedeSolicitarCredito() && !this.estaEliminado();
  }

  estaEliminado(): boolean {
    return this.deletedAt !== null;
  }

  actualizarEstado(nuevoEstado: EstadoSocio): Socio {
    return new Socio({ ...this.toProps(), estado: nuevoEstado });
  }

  eliminar(): Socio {
    return new Socio({ ...this.toProps(), deletedAt: new Date(), estado: EstadoSocio.RETIRADO });
  }

  actualizarDatos(datos: Partial<Omit<SocioProps, 'id' | 'codigo' | 'createdAt'>>): Socio {
    return new Socio({ ...this.toProps(), ...datos });
  }

  toProps(): SocioProps {
    return {
      id: this.id,
      codigo: this.codigo,
      codigoSocio: this.codigoSocio ?? undefined,
      nombre: this.nombre,
      tipoDocumento: this.tipoDocumento,
      numeroDocumento: this.numeroDocumento,
      email: this.email,
      telefono: this.telefono,
      fechaIngreso: this.fechaIngreso,
      aporteMensual: this.aporteMensual,
      ahorroAcumulado: this.ahorroAcumulado,
      estado: this.estado,
      cargo: this.cargo,
      sede: this.sede,
      deletedAt: this.deletedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
