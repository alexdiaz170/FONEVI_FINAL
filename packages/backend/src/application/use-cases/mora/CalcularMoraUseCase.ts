import { MoraService, MoraCalculada } from '../../../domain/services/MoraService.js';

export class CalcularMoraUseCase {
  constructor(private readonly moraService: MoraService) {}

  async execute(socioId?: string): Promise<MoraCalculada | MoraCalculada[]> {
    if (socioId) {
      const result = await this.moraService.calcularMoraPorSocio(socioId);
      return result ?? [];
    }
    return await this.moraService.listarSociosEnMora();
  }
}
