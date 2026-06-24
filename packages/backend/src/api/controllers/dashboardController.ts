import { Request, Response, NextFunction } from 'express';
import { ObtenerResumenDashboardUseCase } from '../../application/use-cases/dashboard/ObtenerResumenDashboardUseCase.js';
import { ObtenerBalanceUseCase } from '../../application/use-cases/movimientos/ObtenerBalanceUseCase.js';
import { CalculadorBalanceGeneral } from '../../domain/services/contabilidad.js';
import { ConfiguracionService } from '../../application/services/ConfiguracionService.js';
import { IDashboardRepository } from '../../domain/repositories/IDashboardRepository.js';
import { apiResponse } from '../response.js';

export function createDashboardController(dashboardRepo: IDashboardRepository) {
  const resumenUseCase = new ObtenerResumenDashboardUseCase(dashboardRepo);
  const configService = new ConfiguracionService();
  const balanceUseCase = new ObtenerBalanceUseCase(new CalculadorBalanceGeneral());

  return {
    async resumen(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const data = await resumenUseCase.execute();
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },

    async balance(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const data = await balanceUseCase.execute();
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },
  };
}
