import { Socio } from '../../../domain/entities/Socio.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

export class ObtenerSocioUseCase {
  constructor(private readonly socioRepo: ISocioRepository) {}

  async execute(idOrCodigo: string): Promise<Socio> {
    const socio = await this.socioRepo.findByIdOrCodigo(idOrCodigo);
    if (!socio || socio.estaEliminado()) {
      throw new EntityNotFoundError('Socio', idOrCodigo);
    }
    return socio;
  }
}
