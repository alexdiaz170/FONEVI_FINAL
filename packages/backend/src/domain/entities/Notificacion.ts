import { DomainError } from '../errors.js';

export interface NotificacionProps {
  id?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida?: boolean;
  urgente?: boolean;
  createdAt?: Date;
}

export class Notificacion {
  readonly id: string;
  readonly tipo: string;
  readonly titulo: string;
  readonly mensaje: string;
  readonly leida: boolean;
  readonly urgente: boolean;
  readonly createdAt: Date;

  private constructor(props: NotificacionProps) {
    this.id = props.id ?? crypto.randomUUID();
    this.tipo = props.tipo;
    this.titulo = props.titulo;
    this.mensaje = props.mensaje;
    this.leida = props.leida ?? false;
    this.urgente = props.urgente ?? false;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: NotificacionProps): Notificacion {
    if (!props.titulo || props.titulo.trim().length < 2) {
      throw new DomainError('El título debe tener al menos 2 caracteres');
    }
    if (!props.mensaje || props.mensaje.trim().length < 3) {
      throw new DomainError('El mensaje debe tener al menos 3 caracteres');
    }
    return new Notificacion(props);
  }

  static fromPersistence(data: NotificacionProps): Notificacion {
    return new Notificacion(data);
  }

  marcarLeida(): Notificacion {
    return new Notificacion({ ...this, leida: true });
  }

  esUrgente(): boolean {
    return this.urgente;
  }
}
