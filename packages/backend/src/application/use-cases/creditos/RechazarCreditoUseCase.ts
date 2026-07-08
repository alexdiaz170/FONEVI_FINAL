import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { EntityNotFoundError, DomainError } from '../../../domain/errors.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class RechazarCreditoUseCase {
  constructor(private readonly creditoRepo: ICreditoRepository) {}

  async execute(creditoId: string): Promise<void> {
    const credito = await this.creditoRepo.findById(creditoId);
    if (!credito) throw new EntityNotFoundError('Crédito', creditoId);

    if (!credito.esPendiente()) {
      throw new DomainError('Solo se pueden rechazar créditos en estado pendiente');
    }

    const cancelado = credito.cancelar();

    const prisma = getPrismaClient();
    await prisma.$transaction(async () => {
      await this.creditoRepo.update(cancelado);
      await prisma.creditoMovimiento.create({
        data: {
          creditoId: credito.id,
          tipo: 'cancelacion',
          monto: credito.monto.value,
          saldoCapitalAnterior: Number(credito.saldoCapital.value),
          saldoCapitalPosterior: Number(cancelado.saldoCapital.value),
          descripcion: 'Crédito rechazado',
        },
      });
    });
  }
}
