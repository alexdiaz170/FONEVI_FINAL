import { Request, Response, NextFunction } from 'express';
import { IWaLogRepository } from '../../domain/repositories/IWaLogRepository.js';
import { EnviarWhatsAppUseCase } from '../../application/use-cases/whatsapp/EnviarWhatsAppUseCase.js';
import { ListarLogsWhatsAppUseCase } from '../../application/use-cases/whatsapp/ListarLogsWhatsAppUseCase.js';
import { VerEstadoWhatsAppUseCase } from '../../application/use-cases/whatsapp/VerEstadoWhatsAppUseCase.js';
import { enviarWhatsAppSchema, listarLogsSchema } from '../../application/dto/whatsapp.dto.js';
import { apiResponse } from '../response.js';
import { ValidationError } from '../../application/errors.js';

export function createWhatsAppController(waLogRepo: IWaLogRepository) {
  const enviarUseCase = new EnviarWhatsAppUseCase(waLogRepo);
  const listarLogsUseCase = new ListarLogsWhatsAppUseCase(waLogRepo);
  const verEstadoUseCase = new VerEstadoWhatsAppUseCase();

  return {
    async enviar(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = enviarWhatsAppSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }
        const result = await enviarUseCase.execute(parsed.data);
        apiResponse.success(res, result, result.success ? 200 : 502);
      } catch (error) {
        next(error);
      }
    },

    async logs(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarLogsSchema.parse(req.query);
        const result = await listarLogsUseCase.execute(query);
        apiResponse.paginated(res, result.data, result.total, result.page, result.limit);
      } catch (error) {
        next(error);
      }
    },

    async estado(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const estado = await verEstadoUseCase.execute();
        apiResponse.success(res, estado);
      } catch (error) {
        next(error);
      }
    },
  };
}
