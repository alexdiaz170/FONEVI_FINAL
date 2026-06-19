import {
  ISolidaridadMovimientoRepository,
  SolidaridadListResult,
} from '../../../domain/repositories/ISolidaridadMovimientoRepository.js';

export class ListarSolidaridadUseCase {
  constructor(private readonly solidaridadRepo: ISolidaridadMovimientoRepository) {}

  async execute(filters: {
    tipo?: string;
    page?: number;
    limit?: number;
  }): Promise<SolidaridadListResult> {
    return await this.solidaridadRepo.findAll(filters);
  }
}
