import { Notificacion } from '../entities/Notificacion.js';

export interface NotificacionFilter {
  leida?: boolean;
  tipo?: string;
  page?: number;
  limit?: number;
}

export interface NotificacionListResult {
  data: Notificacion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface INotificacionRepository {
  findById(id: string): Promise<Notificacion | null>;
  findAll(filters?: NotificacionFilter): Promise<NotificacionListResult>;
  save(notificacion: Notificacion): Promise<Notificacion>;
  marcarLeida(id: string): Promise<Notificacion>;
  delete(id: string): Promise<void>;
  countNoLeidas(): Promise<number>;
}
