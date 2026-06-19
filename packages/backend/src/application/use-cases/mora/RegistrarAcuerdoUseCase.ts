import { Monto } from '@fonevi/shared';
import { AcuerdoPago } from '../../../domain/entities/AcuerdoPago.js';
import { IAcuerdoPagoRepository } from '../../../domain/repositories/IAcuerdoPagoRepository.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

export class RegistrarAcuerdoUseCase {
  constructor(
    private readonly acuerdoRepo: IAcuerdoPagoRepository,
    private readonly socioRepo: ISocioRepository,
  ) {}

  async execute(dto: {
    socioId: string;
    montoTotal: number;
    cuotas: number;
    fechaInicio?: string | null;
    notas?: string | null;
  }): Promise<AcuerdoPago> {
    const socio = await this.socioRepo.findById(dto.socioId);
    if (!socio) throw new EntityNotFoundError('Socio', dto.socioId);

    const montoCuota = Monto.create(Math.round((dto.montoTotal / dto.cuotas) * 100) / 100);

    const acuerdo = AcuerdoPago.create({
      socioId: dto.socioId,
      montoTotal: Monto.create(dto.montoTotal),
      cuotas: dto.cuotas,
      montoCuota,
      fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : new Date(),
      notas: dto.notas ?? null,
    });

    return await this.acuerdoRepo.save(acuerdo);
  }
}
