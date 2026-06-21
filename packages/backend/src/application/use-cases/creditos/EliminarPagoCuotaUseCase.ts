import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { IPagoCuotaRepository } from '../../../domain/repositories/IPagoCuotaRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

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

    await this.pagoCuotaRepo.delete(pagoId);

    const creditoRevertido = credito.revertirPagoCuota(pago.montoCapital);
    await this.creditoRepo.update(creditoRevertido);
  }
}
