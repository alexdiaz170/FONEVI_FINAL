import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { EntityNotFoundError, DomainError } from '../../../domain/errors.js';

export class RechazarCreditoUseCase {
  constructor(private readonly creditoRepo: ICreditoRepository) {}

  async execute(creditoId: string): Promise<void> {
    const credito = await this.creditoRepo.findById(creditoId);
    if (!credito) throw new EntityNotFoundError('Crédito', creditoId);

    if (!credito.esPendiente()) {
      throw new DomainError('Solo se pueden rechazar créditos en estado pendiente');
    }

    const cancelado = credito.cancelar();
    await this.creditoRepo.update(cancelado);
  }
}
