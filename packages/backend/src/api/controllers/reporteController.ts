import { Request, Response, NextFunction } from 'express';
import { ObtenerBalanceUseCase } from '../../application/use-cases/movimientos/ObtenerBalanceUseCase.js';
import { ObtenerCarteraUseCase } from '../../application/use-cases/reportes/ObtenerCarteraUseCase.js';
import { ObtenerFlujoCajaUseCase } from '../../application/use-cases/reportes/ObtenerFlujoCajaUseCase.js';
import { ObtenerEstadoCuentaSocioUseCase } from '../../application/use-cases/reportes/ObtenerEstadoCuentaSocioUseCase.js';
import { CalculadorBalanceGeneral } from '../../domain/services/contabilidad.js';
import { ConfiguracionService } from '../../application/services/ConfiguracionService.js';
import { apiResponse } from '../response.js';

export function createReporteController() {
  const configService = new ConfiguracionService();
  const balanceUseCase = new ObtenerBalanceUseCase(new CalculadorBalanceGeneral());
  const carteraUseCase = new ObtenerCarteraUseCase();
  const flujoCajaUseCase = new ObtenerFlujoCajaUseCase();
  const estadoCuentaSocioUseCase = new ObtenerEstadoCuentaSocioUseCase();

  return {
    async balanceGeneral(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const data = await balanceUseCase.execute();
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },

    async cartera(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const data = await carteraUseCase.execute();
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },

    async flujoCaja(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const desde = req.query.desde as string | undefined;
        const hasta = req.query.hasta as string | undefined;
        const data = await flujoCajaUseCase.execute(desde, hasta);
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },

    async estadoCuentaSocio(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const socioId = String(req.params.socioId ?? '');
        const data = await estadoCuentaSocioUseCase.execute(socioId);
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },
  };
}
