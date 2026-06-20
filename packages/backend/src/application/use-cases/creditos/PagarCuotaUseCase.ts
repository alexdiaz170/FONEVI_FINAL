import { Monto } from '@fonevi/shared';
import { PagoCuota } from '../../../domain/entities/PagoCuota.js';
import { CalculadorCuota } from '../../../domain/services/CalculadorCuota.js';
import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { IPagoCuotaRepository } from '../../../domain/repositories/IPagoCuotaRepository.js';
import { EntityNotFoundError, DomainError } from '../../../domain/errors.js';

const TASA_SEGURO = 0.5 / 1000;

export class PagarCuotaUseCase {
  constructor(
    private readonly creditoRepo: ICreditoRepository,
    private readonly pagoCuotaRepo: IPagoCuotaRepository,
    private readonly calculador: CalculadorCuota,
  ) {}

  async execute(creditoId: string, dto: { fechaPago?: string | null }): Promise<PagoCuota> {
    const credito = await this.creditoRepo.findById(creditoId);
    if (!credito) throw new EntityNotFoundError('Credito', creditoId);

    if (!credito.esActivo()) {
      throw new DomainError('El crédito no está activo');
    }

    if (credito.cuotasRestantes <= 0) {
      throw new DomainError('El crédito ya está completamente pagado');
    }

    const cuotaFija = this.calculador.calcularCuotaFijaConSeguro(
      credito.monto,
      credito.tasaMensual.value,
      credito.cuotas,
      TASA_SEGURO,
    );
    const cuotaCalculada = this.calculador.calcularCuotaActual(
      credito.saldoCapital,
      credito.tasaMensual.value,
      credito.cuotasRestantes,
      cuotaFija,
      TASA_SEGURO,
    );

    const fechaPago = dto.fechaPago ? new Date(dto.fechaPago) : new Date();

    const pagoCuota = PagoCuota.create({
      creditoId: credito.id,
      numeroCuota: credito.cuotasPagadas + 1,
      monto: cuotaCalculada.monto,
      montoCapital: cuotaCalculada.montoCapital,
      montoInteres: cuotaCalculada.montoInteres,
      fechaPago,
    });

    const saved = await this.pagoCuotaRepo.save(pagoCuota);

    const creditoActualizado = credito.registrarPagoCuota(
      cuotaCalculada.montoCapital,
      cuotaCalculada.montoInteres,
      fechaPago,
    );

    await this.creditoRepo.update(creditoActualizado);

    return saved;
  }
}
