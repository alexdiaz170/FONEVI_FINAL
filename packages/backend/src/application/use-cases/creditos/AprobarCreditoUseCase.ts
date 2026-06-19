import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { EntityNotFoundError, DomainError } from '../../../domain/errors.js';

export class AprobarCreditoUseCase {
  constructor(private readonly creditoRepo: ICreditoRepository) {}

  async execute(creditoId: string, aprobadoPor: string): Promise<void> {
    const credito = await this.creditoRepo.findById(creditoId);
    if (!credito) throw new EntityNotFoundError('Crédito', creditoId);

    if (!credito.esPendiente()) {
      throw new DomainError('Solo se pueden aprobar créditos en estado pendiente');
    }

    const aprobado = credito.aprobar(aprobadoPor);
    await this.creditoRepo.update(aprobado);
  }
}
