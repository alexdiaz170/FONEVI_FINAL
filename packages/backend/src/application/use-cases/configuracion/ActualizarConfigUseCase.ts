import { Configuracion } from '../../../domain/entities/Configuracion.js';
import { IConfiguracionRepository } from '../../../domain/repositories/IConfiguracionRepository.js';

export class ActualizarConfigUseCase {
  constructor(private readonly configRepo: IConfiguracionRepository) {}

  async execute(clave: string, valor: string): Promise<Configuracion> {
    const existente = await this.configRepo.findByClave(clave);
    if (existente) {
      return await this.configRepo.save(existente.actualizarValor(valor));
    }
    return await this.configRepo.save(Configuracion.create({ clave, valor }));
  }
}
