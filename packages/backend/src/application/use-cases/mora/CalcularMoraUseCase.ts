import { MoraService, MoraCalculada } from '../../../domain/services/MoraService.js';
import { ConfiguracionService } from '../../services/ConfiguracionService.js';

export class CalcularMoraUseCase {
  constructor(
    private readonly moraService: MoraService,
    private readonly configService: ConfiguracionService,
  ) {}

  async execute(socioId?: string): Promise<MoraCalculada | MoraCalculada[]> {
    const tasaMora = await this.configService.getTasaMoraMensual();
    if (socioId) {
      const result = await this.moraService.calcularMoraPorSocio(socioId, tasaMora);
      return result ?? [];
    }
    return await this.moraService.listarSociosEnMora(tasaMora);
  }
}
