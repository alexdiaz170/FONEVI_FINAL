import { Request, Response, NextFunction } from 'express';
import { ListarAuditoriaUseCase } from '../../application/use-cases/auditoria/ListarAuditoriaUseCase.js';
import { apiResponse } from '../response.js';
import { listarAuditoriaSchema } from '../../application/dto/sprint6.dto.js';

export function createAuditoriaController() {
  const listarUseCase = new ListarAuditoriaUseCase();

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarAuditoriaSchema.parse(req.query);
        const result = await listarUseCase.execute(query);
        apiResponse.paginated(res, result.data, result.total, result.page, result.limit);
      } catch (error) {
        next(error);
      }
    },
  };
}
