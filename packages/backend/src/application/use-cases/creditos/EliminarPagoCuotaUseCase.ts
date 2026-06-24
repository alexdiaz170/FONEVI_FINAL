import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { IPagoCuotaRepository } from '../../../domain/repositories/IPagoCuotaRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class EliminarPagoCuotaUseCase {
  constructor(
    private readonly pagoCuotaRepo: IPagoCuotaRepository,
    private readonly creditoRepo: ICreditoRepository,
  ) {}

  async execute(pagoId: string): Promise<void> {
    const pago = await this.pagoCuotaRepo.findById(pagoId);
    if (!pago) throw new EntityNotFoundError('PagoCuota', pagoId);

    const credito = await this.creditoRepo.findById(pago.creditoId);
    if (!credito) throw new EntityNotFoundError('Credito', pago.creditoId);

    const prisma = getPrismaClient();
    await prisma.$transaction(async () => {
      await this.pagoCuotaRepo.delete(pagoId);

      const creditoRevertido = credito.revertirPagoCuota(pago.montoCapital);
      await this.creditoRepo.update(creditoRevertido);

      await prisma.creditoMovimiento.create({
        data: {
          creditoId: credito.id,
          tipo: 'reversion',
          monto: pago.monto.value,
          montoCapital: pago.montoCapital.value,
          montoInteres: pago.montoInteres.value,
          saldoCapitalAnterior: Number(credito.saldoCapital.value),
          saldoCapitalPosterior: Number(creditoRevertido.saldoCapital.value),
          descripcion: `Reversión de pago cuota #${pago.numeroCuota}`,
        },
      });
    });
  }
}
