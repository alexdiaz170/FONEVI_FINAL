import { Credito } from '../entities/Credito.js';

export interface CreditoFilter {
  socioId?: string;
  estado?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  page?: number;
  limit?: number;
}

export interface CreditoListResult {
  data: Credito[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICreditoRepository {
  findById(id: string): Promise<Credito | null>;
  findAll(filters?: CreditoFilter): Promise<CreditoListResult>;
  findActiveOrPendingBySocioId(socioId: string): Promise<Credito | null>;
  sumSaldoCapitalBySocioId(socioId: string): Promise<number>;
  save(credito: Credito): Promise<Credito>;
  update(credito: Credito): Promise<Credito>;
  softDelete(id: string): Promise<void>;
  countByEstado(estado: string): Promise<number>;
  sumMontoByEstados(estados: string[]): Promise<number>;
  sumSaldoCapitalByEstado(estado: string): Promise<number>;
  countDistinctSocioIdByEstados(estados: string[]): Promise<number>;
}
