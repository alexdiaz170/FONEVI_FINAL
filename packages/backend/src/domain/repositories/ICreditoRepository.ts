import { Credito } from '../entities/Credito.js';

export interface CreditoFilter {
  socioId?: string;
  estado?: string;
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
  findActivoBySocioId(socioId: string): Promise<Credito | null>;
  save(credito: Credito): Promise<Credito>;
  update(credito: Credito): Promise<Credito>;
  softDelete(id: string): Promise<void>;
}
