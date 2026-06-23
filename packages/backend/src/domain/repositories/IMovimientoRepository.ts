import { Movimiento } from '../entities/Movimiento.js';

export interface MovimientoFilter {
  tipo?: string;
  categoria?: string;
  desde?: Date;
  hasta?: Date;
  q?: string;
  page?: number;
  limit?: number;
}

export interface MovimientoListResult {
  data: Movimiento[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IMovimientoRepository {
  findById(id: string): Promise<Movimiento | null>;
  findAll(filters?: MovimientoFilter): Promise<MovimientoListResult>;
  save(movimiento: Movimiento): Promise<Movimiento>;
  update(movimiento: Movimiento): Promise<Movimiento>;
  delete(id: string): Promise<void>;
  sumMontoByTipo(tipo: string): Promise<number>;
}
