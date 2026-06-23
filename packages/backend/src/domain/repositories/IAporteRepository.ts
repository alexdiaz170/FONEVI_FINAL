import { Aporte } from '../entities/Aporte.js';
import { Monto } from '@fonevi/shared';

export interface AporteFilter {
  socioId?: string;
  periodoId?: number;
  periodo?: string;
  estado?: string;
  fecha?: string;
  metodo?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface AporteListResult {
  data: Aporte[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAporteRepository {
  findById(id: string): Promise<Aporte | null>;
  findAll(filters?: AporteFilter): Promise<AporteListResult>;
  save(aporte: Aporte): Promise<Aporte>;
  update(aporte: Aporte): Promise<Aporte>;
  delete(id: string): Promise<void>;
  recalcularAhorroAcumulado(socioId: string): Promise<Monto>;
  sumMontoByEstado(estado: string, desde?: Date): Promise<number>;
}
