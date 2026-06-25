import { Request, Response, NextFunction } from 'express';
import { ValidarCierrePeriodoUseCase } from '../../application/use-cases/cierre-periodo/ValidarCierrePeriodoUseCase.js';
import { SimularCierrePeriodoUseCase } from '../../application/use-cases/cierre-periodo/SimularCierrePeriodoUseCase.js';
import { EjecutarCierrePeriodoUseCase } from '../../application/use-cases/cierre-periodo/EjecutarCierrePeriodoUseCase.js';
import { apiResponse } from '../response.js';

export function createCierrePeriodoController() {
  const validarUseCase = new ValidarCierrePeriodoUseCase();
  const simularUseCase = new SimularCierrePeriodoUseCase();
  const ejecutarUseCase = new EjecutarCierrePeriodoUseCase();

  return {
    async validar(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const result = await validarUseCase.execute();
        apiResponse.success(res, result);
      } catch (error) {
        next(error);
      }
    },

    async simular(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const result = await simularUseCase.execute();
        apiResponse.success(res, result);
      } catch (error) {
        next(error);
      }
    },

    async ejecutar(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const usuarioId = req.usuario?.id ?? 'sistema';
        const result = await ejecutarUseCase.execute(usuarioId);
        apiResponse.success(res, result);
      } catch (error) {
        next(error);
      }
    },
  };
}
