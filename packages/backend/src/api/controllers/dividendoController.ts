import { Request, Response, NextFunction } from 'express';
import { IDividendoRepository } from '../../domain/repositories/IDividendoRepository.js';
import { ISocioRepository } from '../../domain/repositories/ISocioRepository.js';
import { CrearDividendoUseCase } from '../../application/use-cases/dividendos/CrearDividendoUseCase.js';
import { DistribuirDividendoUseCase } from '../../application/use-cases/dividendos/DistribuirDividendoUseCase.js';
import { apiResponse } from '../response.js';
import {
  crearDividendoSchema,
  distribuirDividendoSchema,
} from '../../application/dto/sprint6.dto.js';
import { ValidationError } from '../../application/errors.js';

export function createDividendoController(
  dividendoRepo: IDividendoRepository,
  socioRepo: ISocioRepository,
) {
  const crearUseCase = new CrearDividendoUseCase(dividendoRepo);
  const distribuirUseCase = new DistribuirDividendoUseCase(dividendoRepo, socioRepo);

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const result = await dividendoRepo.findAll(page, limit);
        apiResponse.paginated(res, result.data, result.total, result.page, result.limit);
      } catch (error) {
        next(error);
      }
    },

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const result = await dividendoRepo.findByIdWithSocios(id);
        if (!result) {
          apiResponse.error(res, 404, 'Dividendo no encontrado');
          return;
        }
        apiResponse.success(res, result);
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = crearDividendoSchema.safeParse(req.body);
        if (!parsed.success)
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        const dividendo = await crearUseCase.execute(parsed.data);
        apiResponse.created(res, dividendo);
      } catch (error) {
        next(error);
      }
    },

    async distribuir(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const parsed = distribuirDividendoSchema.safeParse(req.body);
        if (!parsed.success)
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        const result = await distribuirUseCase.execute(id, parsed.data.socioIds);
        apiResponse.success(res, result);
      } catch (error) {
        next(error);
      }
    },
  };
}
