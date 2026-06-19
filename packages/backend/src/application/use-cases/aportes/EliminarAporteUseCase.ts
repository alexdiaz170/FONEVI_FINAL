import { IAporteRepository } from '../../../domain/repositories/IAporteRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class EliminarAporteUseCase {
  constructor(private readonly aporteRepo: IAporteRepository) {}

  async execute(id: string): Promise<void> {
    const aporte = await this.aporteRepo.findById(id);
    if (!aporte) throw new EntityNotFoundError('Aporte', id);

    await this.aporteRepo.delete(id);

    const prisma = getPrismaClient();
    const nuevoAhorro = await this.aporteRepo.recalcularAhorroAcumulado(aporte.socioId);
    await prisma.socio.update({
      where: { id: aporte.socioId },
      data: { ahorroAcumulado: nuevoAhorro.value },
    });
  }
}
