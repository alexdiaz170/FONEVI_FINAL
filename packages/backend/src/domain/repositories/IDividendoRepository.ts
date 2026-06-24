import { Dividendo } from '../entities/Dividendo.js';
import { DividendoSocio } from '../entities/DividendoSocio.js';

export interface DividendoSocioDetail {
  id: string;
  socioId: string;
  socioNombre: string;
  monto: number;
  pagado: boolean;
  fechaPago: Date | null;
  createdAt: Date;
}

export interface DividendoDetail extends Dividendo {
  socios: DividendoSocioDetail[];
}

export interface IDividendoRepository {
  findById(id: string): Promise<Dividendo | null>;
  findByIdWithSocios(id: string): Promise<DividendoDetail | null>;
  findAll(
    page?: number,
    limit?: number,
  ): Promise<{ data: Dividendo[]; total: number; page: number; limit: number; totalPages: number }>;
  save(dividendo: Dividendo): Promise<Dividendo>;
  saveSocioDividendos(items: DividendoSocio[]): Promise<DividendoSocio[]>;
  findBySocioId(socioId: string): Promise<DividendoSocio[]>;
}
