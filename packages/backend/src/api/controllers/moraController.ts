import { Request, Response, NextFunction } from 'express';
import { IAcuerdoPagoRepository } from '../../domain/repositories/IAcuerdoPagoRepository.js';
import { ISocioRepository } from '../../domain/repositories/ISocioRepository.js';
import { MoraService } from '../../domain/services/MoraService.js';
import { CalcularMoraUseCase } from '../../application/use-cases/mora/CalcularMoraUseCase.js';
import { RegistrarAcuerdoUseCase } from '../../application/use-cases/mora/RegistrarAcuerdoUseCase.js';
import { ListarAcuerdosUseCase } from '../../application/use-cases/mora/ListarAcuerdosUseCase.js';
import { ConfiguracionService } from '../../application/services/ConfiguracionService.js';
import { apiResponse } from '../response.js';
import {
  registrarAcuerdoSchema,
  listarAuditoriaSchema,
} from '../../application/dto/sprint6.dto.js';
import { ValidationError } from '../../application/errors.js';

export function createMoraController(
  acuerdoRepo: IAcuerdoPagoRepository,
  socioRepo: ISocioRepository,
) {
  const moraService = new MoraService();
  const configService = new ConfiguracionService();
  const calcularUseCase = new CalcularMoraUseCase(moraService, configService);
  const registrarAcuerdoUseCase = new RegistrarAcuerdoUseCase(acuerdoRepo, socioRepo);
  const listarAcuerdosUseCase = new ListarAcuerdosUseCase(acuerdoRepo);

  return {
    async calcular(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const socioId = req.query.socioId ? String(req.query.socioId) : undefined;
        const result = await calcularUseCase.execute(socioId);
        apiResponse.success(res, result);
      } catch (error) {
        next(error);
      }
    },

    async listarAcuerdos(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarAuditoriaSchema.parse(req.query);
        const result = await listarAcuerdosUseCase.execute(query.page, query.limit);
        apiResponse.paginated(res, result.data, result.total, result.page, result.limit);
      } catch (error) {
        next(error);
      }
    },

    async crearAcuerdo(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = registrarAcuerdoSchema.safeParse(req.body);
        if (!parsed.success)
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        const acuerdo = await registrarAcuerdoUseCase.execute(parsed.data);
        apiResponse.created(res, acuerdo);
      } catch (error) {
        next(error);
      }
    },
  };
}
