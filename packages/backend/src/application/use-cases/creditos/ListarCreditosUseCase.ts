import {
  ICreditoRepository,
  CreditoListResult,
} from '../../../domain/repositories/ICreditoRepository.js';

export class ListarCreditosUseCase {
  constructor(private readonly creditoRepo: ICreditoRepository) {}

  async execute(filters: {
    socioId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
  }): Promise<CreditoListResult> {
    return await this.creditoRepo.findAll({
      socioId: filters.socioId,
      estado: filters.estado,
      fechaDesde: filters.fechaDesde ? new Date(filters.fechaDesde) : undefined,
      fechaHasta: filters.fechaHasta ? new Date(filters.fechaHasta) : undefined,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    });
  }
}
