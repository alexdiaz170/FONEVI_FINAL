import { Configuracion } from '../../../domain/entities/Configuracion.js';
import { IConfiguracionRepository } from '../../../domain/repositories/IConfiguracionRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

export class ObtenerConfigUseCase {
  constructor(private readonly configRepo: IConfiguracionRepository) {}

  async execute(clave: string): Promise<Configuracion> {
    const config = await this.configRepo.findByClave(clave);
    if (!config) throw new EntityNotFoundError('Configuracion', clave);
    return config;
  }

  async listAll(): Promise<Configuracion[]> {
    return await this.configRepo.findAll();
  }
}
