import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { EntityNotFoundError, DomainError } from '../../../domain/errors.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class AprobarCreditoUseCase {
  constructor(private readonly creditoRepo: ICreditoRepository) {}

  async execute(creditoId: string, aprobadoPor: string): Promise<void> {
    const credito = await this.creditoRepo.findById(creditoId);
    if (!credito) throw new EntityNotFoundError('Crédito', creditoId);

    if (!credito.esPendiente()) {
      throw new DomainError('Solo se pueden aprobar créditos en estado pendiente');
    }

    const aprobado = credito.aprobar(aprobadoPor);

    const prisma = getPrismaClient();
    await prisma.$transaction(async () => {
      await this.creditoRepo.update(aprobado);
      await prisma.creditoMovimiento.create({
        data: {
          creditoId: credito.id,
          tipo: 'aprobacion',
          monto: credito.monto.value,
          saldoCapitalAnterior: Number(credito.saldoCapital.value),
          saldoCapitalPosterior: Number(aprobado.saldoCapital.value),
          descripcion: `Crédito aprobado por ${aprobadoPor}`,
        },
      });
    });
  }
}
