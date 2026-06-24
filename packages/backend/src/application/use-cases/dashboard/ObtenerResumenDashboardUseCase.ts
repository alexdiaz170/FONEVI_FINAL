import { IDashboardRepository } from '../../../domain/repositories/IDashboardRepository.js';
import { dashboardCache } from '../../../infrastructure/cache/SimpleCache.js';

const CACHE_TTL = 20_000;
const CACHE_KEY = 'dashboard:resumen';

export interface ResumenDashboard {
  socios: {
    activos: number;
    enMora: number;
    total: number;
  };
  ahorros: {
    totalAcumulado: number;
  };
  creditos: {
    activos: number;
    montoPrestado: number;
    saldoPorCobrar: number;
    pagados: number;
  };
  aportes: {
    delMes: number;
    totalRecibido: number;
  };
  solidaridad: {
    totalRecibido: number;
  };
  movimientos: {
    ingresos: number;
    egresos: number;
  };
}

export class ObtenerResumenDashboardUseCase {
  constructor(private readonly dashboardRepo: IDashboardRepository) {}

  async execute(): Promise<ResumenDashboard> {
    const cached = dashboardCache.get<ResumenDashboard>(CACHE_KEY);
    if (cached) return cached;

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const r = await this.dashboardRepo.getResumen(inicioMes);

    const result: ResumenDashboard = {
      socios: {
        activos: r.sociosActivos,
        enMora: r.sociosMora,
        total: r.totalSocios,
      },
      ahorros: {
        totalAcumulado: r.totalAhorros,
      },
      creditos: {
        activos: r.creditosActivos,
        montoPrestado: r.montoPrestado,
        saldoPorCobrar: r.saldoPorCobrar,
        pagados: r.creditosPagados,
      },
      aportes: {
        delMes: r.aportesMes,
        totalRecibido: r.totalAportes,
      },
      solidaridad: {
        totalRecibido: r.solidaridadTotal,
      },
      movimientos: {
        ingresos: r.ingresos,
        egresos: r.egresos,
      },
    };

    dashboardCache.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  }
}
