import { PagoCuota } from '../entities/PagoCuota.js';

export interface IPagoCuotaRepository {
  findById(id: string): Promise<PagoCuota | null>;
  findByCreditoId(creditoId: string): Promise<PagoCuota[]>;
  save(pagoCuota: PagoCuota): Promise<PagoCuota>;
  delete(id: string): Promise<void>;
}
