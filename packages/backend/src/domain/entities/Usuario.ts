import { Email } from '@fonevi/shared';
import { DomainError } from '../errors.js';

export type UsuarioRol = 'admin' | 'socio' | 'superadmin' | 'contador';
export type UsuarioEstado = 'activo' | 'inactivo' | 'suspendido';

export interface UsuarioProps {
  id?: string;
  nombre: string;
  email: Email;
  rol: UsuarioRol;
  estado?: UsuarioEstado;
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Usuario {
  readonly id: string;
  readonly nombre: string;
  readonly email: Email;
  readonly rol: UsuarioRol;
  readonly estado: UsuarioEstado;
  readonly avatar: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: UsuarioProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.nombre = props.nombre;
    this.email = props.email;
    this.rol = props.rol;
    this.estado = props.estado ?? 'activo';
    this.avatar = props.avatar ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static create(props: UsuarioProps): Usuario {
    if (!props.nombre || props.nombre.trim().length < 2) {
      throw new DomainError('El nombre debe tener al menos 2 caracteres');
    }
    if (!['admin', 'socio', 'superadmin', 'contador'].includes(props.rol)) {
      throw new DomainError('Rol de usuario inválido');
    }
    return new Usuario(props);
  }

  static fromPersistence(data: UsuarioProps): Usuario {
    return new Usuario(data);
  }

  esActivo(): boolean {
    return this.estado === 'activo';
  }

  esAdmin(): boolean {
    return this.rol === 'admin' || this.rol === 'superadmin';
  }

  desactivar(): Usuario {
    return new Usuario({ ...this.toProps(), estado: 'inactivo' });
  }

  cambiarNombre(nombre: string): Usuario {
    return new Usuario({ ...this.toProps(), nombre });
  }

  cambiarEmail(email: string): Usuario {
    return new Usuario({ ...this.toProps(), email: Email.create(email) });
  }

  cambiarRol(rol: UsuarioRol): Usuario {
    return new Usuario({ ...this.toProps(), rol });
  }

  toProps(): UsuarioProps {
    return {
      id: this.id,
      nombre: this.nombre,
      email: this.email,
      rol: this.rol,
      estado: this.estado,
      avatar: this.avatar,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
