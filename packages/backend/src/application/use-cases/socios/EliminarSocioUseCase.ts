import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

export class EliminarSocioUseCase {
  constructor(private readonly socioRepo: ISocioRepository) {}

  async execute(id: string): Promise<void> {
    const socio = await this.socioRepo.findById(id);
    if (!socio || socio.estaEliminado()) {
      throw new EntityNotFoundError('Socio', id);
    }

    await this.socioRepo.softDelete(id);
  }
}
