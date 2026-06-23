import { ICreditoRepository } from '../../../domain/repositories/ICreditoRepository.js';

export interface ResumenCreditos {
  totalMontoPrestado: number;
  totalSociosConCredito: number;
  saldoPorCobrar: number;
  creditosActivos: number;
  creditosPagados: number;
  creditosPendientes: number;
}

export class ObtenerResumenCreditosUseCase {
  constructor(private readonly creditoRepo: ICreditoRepository) {}

  async execute(): Promise<ResumenCreditos> {
    const estadosOtorgados = ['activo', 'pagado'];

    const [montoPrestado, totalSociosConCredito, activos, pagados, pendientes, saldoPorCobrar] =
      await Promise.all([
        this.creditoRepo.sumMontoByEstados(estadosOtorgados),
        this.creditoRepo.countDistinctSocioIdByEstados(estadosOtorgados),
        this.creditoRepo.countByEstado('activo'),
        this.creditoRepo.countByEstado('pagado'),
        this.creditoRepo.countByEstado('pendiente'),
        this.creditoRepo.sumSaldoCapitalByEstado('activo'),
      ]);

    return {
      totalMontoPrestado: montoPrestado,
      totalSociosConCredito,
      saldoPorCobrar,
      creditosActivos: activos,
      creditosPagados: pagados,
      creditosPendientes: pendientes,
    };
  }
}
