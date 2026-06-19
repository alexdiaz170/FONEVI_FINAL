import { Monto } from '@fonevi/shared';
import { Dividendo } from '../../../domain/entities/Dividendo.js';
import { IDividendoRepository } from '../../../domain/repositories/IDividendoRepository.js';

export class CrearDividendoUseCase {
  constructor(private readonly dividendoRepo: IDividendoRepository) {}

  async execute(dto: {
    periodo: string;
    montoTotal: number;
    fechaCalculo?: string | null;
  }): Promise<Dividendo> {
    return await this.dividendoRepo.save(
      Dividendo.create({
        periodo: dto.periodo,
        montoTotal: Monto.create(dto.montoTotal),
        fechaCalculo: dto.fechaCalculo ? new Date(dto.fechaCalculo) : new Date(),
      }),
    );
  }
}
