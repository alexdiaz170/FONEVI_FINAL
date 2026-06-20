import { Monto } from '@fonevi/shared';
import { Credito } from '../../../domain/entities/Credito.js';
import { TasaInteres } from '../../../domain/value-objects/TasaInteres.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { DomainError, EntityNotFoundError } from '../../../domain/errors.js';

export class SolicitarCreditoUseCase {
  constructor(
    private readonly socioRepo: ISocioRepository,
    private readonly creditoRepo: ICreditoRepository,
  ) {}

  async execute(dto: {
    socioId: string;
    monto: number;
    tasaMensual: number;
    cuotas: number;
    fechaDesembolso?: string | null;
    proposito?: string | null;
    notas?: string | null;
  }): Promise<Credito> {
    const socio = await this.socioRepo.findById(dto.socioId);
    if (!socio) throw new EntityNotFoundError('Socio', dto.socioId);

    if (!socio.puedeSolicitarCredito()) {
      throw new DomainError('El socio no puede solicitar créditos en su estado actual');
    }

    const MAX_MULTIPLICADOR = 4;
    const maxMonto = socio.ahorroAcumulado.value * MAX_MULTIPLICADOR;
    if (dto.monto > maxMonto) {
      throw new DomainError(
        `El monto del crédito ($${dto.monto.toLocaleString('es-CO')}) excede el máximo permitido. ` +
          `Basado en el ahorro acumulado del socio ($${socio.ahorroAcumulado.value.toLocaleString('es-CO')} × ${MAX_MULTIPLICADOR}), ` +
          `el máximo es $${maxMonto.toLocaleString('es-CO')}.`,
      );
    }

    const monto = Monto.create(dto.monto);
    const tasaMensual = TasaInteres.create(dto.tasaMensual);
    const fechaDesembolso = dto.fechaDesembolso ? new Date(dto.fechaDesembolso) : new Date();

    const credito = Credito.create({
      socioId: dto.socioId,
      monto,
      tasaMensual,
      cuotas: dto.cuotas,
      saldoCapital: monto,
      fechaDesembolso,
      proposito: dto.proposito ?? null,
      notas: dto.notas ?? null,
    });

    return await this.creditoRepo.save(credito);
  }
}
