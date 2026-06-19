import {
  ICreditoRepository,
  CreditoListResult,
} from '../../../domain/repositories/ICreditoRepository.js';

export class ListarCreditosUseCase {
  constructor(private readonly creditoRepo: ICreditoRepository) {}

  async execute(filters: {
    socioId?: string;
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<CreditoListResult> {
    return await this.creditoRepo.findAll({
      socioId: filters.socioId,
      estado: filters.estado,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    });
  }
}
