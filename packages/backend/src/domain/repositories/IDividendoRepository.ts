import { Dividendo } from '../entities/Dividendo.js';
import { DividendoSocio } from '../entities/DividendoSocio.js';

export interface IDividendoRepository {
  findById(id: string): Promise<Dividendo | null>;
  findAll(
    page?: number,
    limit?: number,
  ): Promise<{ data: Dividendo[]; total: number; page: number; limit: number; totalPages: number }>;
  save(dividendo: Dividendo): Promise<Dividendo>;
  saveSocioDividendos(items: DividendoSocio[]): Promise<DividendoSocio[]>;
  findBySocioId(socioId: string): Promise<DividendoSocio[]>;
}
