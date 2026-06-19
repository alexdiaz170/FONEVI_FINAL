import { AcuerdoPago } from '../entities/AcuerdoPago.js';

export interface IAcuerdoPagoRepository {
  findById(id: string): Promise<AcuerdoPago | null>;
  findBySocioId(socioId: string): Promise<AcuerdoPago[]>;
  findAll(
    page?: number,
    limit?: number,
  ): Promise<{
    data: AcuerdoPago[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  save(acuerdo: AcuerdoPago): Promise<AcuerdoPago>;
  update(acuerdo: AcuerdoPago): Promise<AcuerdoPago>;
}
