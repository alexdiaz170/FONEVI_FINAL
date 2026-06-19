import { Request, Response, NextFunction } from 'express';
import { ISolidaridadMovimientoRepository } from '../../domain/repositories/ISolidaridadMovimientoRepository.js';
import { RegistrarSolidaridadUseCase } from '../../application/use-cases/solidaridad/RegistrarSolidaridadUseCase.js';
import { ListarSolidaridadUseCase } from '../../application/use-cases/solidaridad/ListarSolidaridadUseCase.js';
import { apiResponse } from '../response.js';
import {
  registrarSolidaridadSchema,
  listarSolidaridadSchema,
} from '../../application/dto/notificacion-solidaridad.dto.js';
import { ValidationError } from '../../application/errors.js';

export function createSolidaridadController(solidaridadRepo: ISolidaridadMovimientoRepository) {
  const registrarUseCase = new RegistrarSolidaridadUseCase(solidaridadRepo);
  const listarUseCase = new ListarSolidaridadUseCase(solidaridadRepo);

  function mapSolidaridad(m: {
    id: string;
    tipo: string;
    descripcion: string;
    monto: { value: number };
    fecha: Date;
    beneficiario: string | null;
    createdAt: Date;
  }) {
    return {
      id: m.id,
      tipo: m.tipo,
      descripcion: m.descripcion,
      monto: m.monto.value,
      fecha: m.fecha,
      beneficiario: m.beneficiario,
      createdAt: m.createdAt,
    };
  }

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarSolidaridadSchema.parse(req.query);
        const result = await listarUseCase.execute(query);
        apiResponse.paginated(
          res,
          result.data.map(mapSolidaridad),
          result.total,
          result.page,
          result.limit,
        );
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = registrarSolidaridadSchema.safeParse(req.body);
        if (!parsed.success)
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        const movimiento = await registrarUseCase.execute(parsed.data);
        apiResponse.created(res, mapSolidaridad(movimiento));
      } catch (error) {
        next(error);
      }
    },
  };
}
