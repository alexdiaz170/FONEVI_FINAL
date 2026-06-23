import { Monto } from '@fonevi/shared';
import { Credito } from '../../../domain/entities/Credito.js';
import { TasaInteres } from '../../../domain/value-objects/TasaInteres.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { DomainError, EntityNotFoundError } from '../../../domain/errors.js';
import { ConfiguracionService } from '../../services/ConfiguracionService.js';

export class SolicitarCreditoUseCase {
  constructor(
    private readonly socioRepo: ISocioRepository,
    private readonly creditoRepo: ICreditoRepository,
    private readonly configService: ConfiguracionService,
  ) {}

  async execute(
    dto: {
      socioId: string;
      monto: number;
      tasaMensual?: number;
      cuotas: number;
      fechaDesembolso?: string | null;
      proposito?: string | null;
      notas?: string | null;
    },
    rol?: string,
  ): Promise<Credito> {
    const socio = await this.socioRepo.findById(dto.socioId);
    if (!socio) throw new EntityNotFoundError('Socio', dto.socioId);

    if (!socio.puedeSolicitarCredito()) {
      throw new DomainError('El socio no puede solicitar créditos en su estado actual');
    }

    const multiplicador = await this.configService.getMultiplicadorMaximoCredito();
    const capacidadBase = socio.ahorroAcumulado.value * multiplicador;
    const deudaActivaSaldoCapital = await this.creditoRepo.sumSaldoCapitalBySocioId(dto.socioId);
    const maxMonto = Math.max(0, capacidadBase - deudaActivaSaldoCapital);
    if (dto.monto > maxMonto) {
      throw new DomainError(
        `El monto del crédito ($${dto.monto.toLocaleString('es-CO')}) excede el máximo disponible. ` +
          `Basado en el ahorro acumulado ($${socio.ahorroAcumulado.value.toLocaleString('es-CO')} × ${multiplicador}) ` +
          `menos la deuda activa ($${deudaActivaSaldoCapital.toLocaleString('es-CO')}), ` +
          `el máximo disponible es $${maxMonto.toLocaleString('es-CO')}.`,
      );
    }

    const monto = Monto.create(dto.monto);
    const esAdmin = rol === 'admin' || rol === 'superadmin';
    const tasaRaw =
      esAdmin && dto.tasaMensual !== undefined
        ? dto.tasaMensual
        : await this.configService.getTasaInteresMensual();
    const tasaMensual = TasaInteres.create(tasaRaw);
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
