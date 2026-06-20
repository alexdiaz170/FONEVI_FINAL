import { IPeriodoRepository } from '../../../domain/repositories/IPeriodoRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

export class ActivarPeriodoUseCase {
  constructor(private readonly periodoRepo: IPeriodoRepository) {}

  async execute(id: number): Promise<void> {
    const periodo = await this.periodoRepo.findById(id);
    if (!periodo) throw new EntityNotFoundError('Periodo', String(id));

    const periodos = await this.periodoRepo.findAll();
    for (const p of periodos) {
      if (p.activo && p.id !== id) {
        await this.periodoRepo.update(p.desactivar());
      }
    }

    if (!periodo.activo) {
      await this.periodoRepo.update(periodo.activar());
    }
  }
}
