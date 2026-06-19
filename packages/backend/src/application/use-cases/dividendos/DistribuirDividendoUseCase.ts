import { Monto } from '@fonevi/shared';
import { DividendoSocio } from '../../../domain/entities/DividendoSocio.js';
import { IDividendoRepository } from '../../../domain/repositories/IDividendoRepository.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { EntityNotFoundError, DomainError } from '../../../domain/errors.js';

export class DistribuirDividendoUseCase {
  constructor(
    private readonly dividendoRepo: IDividendoRepository,
    private readonly socioRepo: ISocioRepository,
  ) {}

  async execute(dividendoId: string, socioIds: string[]): Promise<DividendoSocio[]> {
    const dividendo = await this.dividendoRepo.findById(dividendoId);
    if (!dividendo) throw new EntityNotFoundError('Dividendo', dividendoId);

    if (dividendo.distribuido) throw new DomainError('El dividendo ya fue distribuido');

    const sociosValidos = (
      await Promise.all(socioIds.map((id) => this.socioRepo.findById(id)))
    ).filter(Boolean);

    const montoPorSocio = Monto.create(
      Math.round((dividendo.montoTotal.value / sociosValidos.length) * 100) / 100,
    );

    const items = sociosValidos.map((s) =>
      DividendoSocio.create({ dividendoId, socioId: s!.id, monto: montoPorSocio }),
    );

    return await this.dividendoRepo.saveSocioDividendos(items);
  }
}
