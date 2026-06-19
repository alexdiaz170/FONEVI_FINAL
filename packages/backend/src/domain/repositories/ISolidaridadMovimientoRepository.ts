import { SolidaridadMovimiento } from '../entities/SolidaridadMovimiento.js';

export interface SolidaridadFilter {
  tipo?: string;
  page?: number;
  limit?: number;
}

export interface SolidaridadListResult {
  data: SolidaridadMovimiento[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ISolidaridadMovimientoRepository {
  findById(id: string): Promise<SolidaridadMovimiento | null>;
  findAll(filters?: SolidaridadFilter): Promise<SolidaridadListResult>;
  save(movimiento: SolidaridadMovimiento): Promise<SolidaridadMovimiento>;
}
