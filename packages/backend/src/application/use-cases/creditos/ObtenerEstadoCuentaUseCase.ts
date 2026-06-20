import { Monto } from '@fonevi/shared';
import { CalculadorCuota } from '../../../domain/services/CalculadorCuota.js';
import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';
import { IPagoCuotaRepository } from '../../../domain/repositories/IPagoCuotaRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

export interface CuotaAmortizacionDTO {
  numeroCuota: number;
  monto: number;
  montoCapital: number;
  montoInteres: number;
  seguro: number;
  saldoRestante: number;
}

export interface EstadoCuentaResult {
  credito: {
    id: string;
    socioId: string;
    monto: number;
    tasaMensual: number;
    cuotas: number;
    cuotasPagadas: number;
    cuotasRestantes: number;
    saldoCapital: number;
    cuotaMensual: number;
    estado: string;
    fechaDesembolso: Date;
    proposito: string | null;
  };
  pagos: Array<{
    id: string;
    numeroCuota: number;
    monto: number;
    montoCapital: number;
    montoInteres: number;
    fechaPago: Date;
  }>;
  tablaAmortizacion: CuotaAmortizacionDTO[];
  totalPagado: number;
  totalPendiente: number;
}

export class ObtenerEstadoCuentaUseCase {
  constructor(
    private readonly creditoRepo: ICreditoRepository,
    private readonly pagoCuotaRepo: IPagoCuotaRepository,
    private readonly calculador: CalculadorCuota,
  ) {}

  async execute(creditoId: string): Promise<EstadoCuentaResult> {
    const credito = await this.creditoRepo.findById(creditoId);
    if (!credito) throw new EntityNotFoundError('Credito', creditoId);

    const pagos = await this.pagoCuotaRepo.findByCreditoId(creditoId);

    const tablaAmortizacion = this.calculador.generarTablaAmortizacion(
      Monto.create(credito.monto.value),
      credito.tasaMensual.value,
      credito.cuotas,
    );

    const totalPagado = pagos.reduce((sum, p) => sum + p.monto.value, 0);
    const totalPendiente = Math.max(0, credito.monto.value - totalPagado);

    return {
      credito: {
        id: credito.id,
        socioId: credito.socioId,
        monto: credito.monto.value,
        tasaMensual: credito.tasaMensual.value,
        cuotas: credito.cuotas,
        cuotasPagadas: credito.cuotasPagadas,
        cuotasRestantes: credito.cuotasRestantes,
        saldoCapital: credito.saldoCapital.value,
        cuotaMensual: credito.cuotaMensual.value,
        estado: credito.estado.toString(),
        fechaDesembolso: credito.fechaDesembolso,
        proposito: credito.proposito,
      },
      pagos: pagos.map((p) => ({
        id: p.id,
        numeroCuota: p.numeroCuota,
        monto: p.monto.value,
        montoCapital: p.montoCapital.value,
        montoInteres: p.montoInteres.value,
        fechaPago: p.fechaPago,
      })),
      tablaAmortizacion: tablaAmortizacion.map((c) => ({
        numeroCuota: c.numero,
        monto: c.monto.value,
        montoCapital: c.montoCapital.value,
        montoInteres: c.montoInteres.value,
        seguro: c.seguro.value,
        saldoRestante: c.saldoRestante.value,
      })),
      totalPagado,
      totalPendiente,
    };
  }
}
