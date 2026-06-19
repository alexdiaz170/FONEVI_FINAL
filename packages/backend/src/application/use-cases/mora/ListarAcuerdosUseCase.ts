import { IAcuerdoPagoRepository } from '../../../domain/repositories/IAcuerdoPagoRepository.js';

export class ListarAcuerdosUseCase {
  constructor(private readonly acuerdoRepo: IAcuerdoPagoRepository) {}

  async execute(page = 1, limit = 10) {
    return await this.acuerdoRepo.findAll(page, limit);
  }
}
