import { Request, Response, NextFunction } from 'express';
import { IConfiguracionRepository } from '../../domain/repositories/IConfiguracionRepository.js';
import { ObtenerConfigUseCase } from '../../application/use-cases/configuracion/ObtenerConfigUseCase.js';
import { ActualizarConfigUseCase } from '../../application/use-cases/configuracion/ActualizarConfigUseCase.js';
import { apiResponse } from '../response.js';
import { actualizarConfigSchema } from '../../application/dto/sprint6.dto.js';
import { ValidationError } from '../../application/errors.js';

export function createConfigController(configRepo: IConfiguracionRepository) {
  const obtenerUseCase = new ObtenerConfigUseCase(configRepo);
  const actualizarUseCase = new ActualizarConfigUseCase(configRepo);

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const configs = await obtenerUseCase.listAll();
        apiResponse.success(res, configs);
      } catch (error) {
        next(error);
      }
    },

    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const clave = String(req.params.clave ?? '');
        const config = await obtenerUseCase.execute(clave);
        apiResponse.success(res, config);
      } catch (error) {
        next(error);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const clave = String(req.params.clave ?? '');
        const parsed = actualizarConfigSchema.safeParse(req.body);
        if (!parsed.success)
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        const config = await actualizarUseCase.execute(clave, parsed.data.valor);
        apiResponse.success(res, config);
      } catch (error) {
        next(error);
      }
    },
  };
}
